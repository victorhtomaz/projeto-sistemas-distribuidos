# Especificação de Rotas — Microsserviço de Autenticação e Autorização

Este documento descreve a arquitetura de rotas do microsserviço de Identidade, Autenticação e Autorização desenvolvido em **.NET / C#** com **OpenIddict** e **Gestão Customizada de Usuários** (sem acoplamento ao ASP.NET Core Identity). O serviço segue as recomendações de segurança das especificações **RFC 9700** (OAuth 2.0 Security Best Current Practice), **RFC 8725** (JWT Best Current Practices) e **OWASP**.

## Visão Geral da Arquitetura

As rotas do serviço são divididas em três camadas de responsabilidade:

1. **Descoberta e Criptografia (`/.well-known/*`):** Gerenciadas 100% pelo middleware do OpenIddict para permitir que clientes e outros microsserviços validem JWTs de forma autônoma.

2. **Protocolo Core OAuth 2.0 / OIDC (`/connect/*`):** Endpoints responsáveis pela emissão, troca, revogação e leitura de claims de tokens.

3. **Gestão de Usuários, Sessões e Clientes (`/api/*`):** Endpoints de domínio da aplicação implementados via Minimal APIs para cadastro manual, autenticação e registro de aplicações clientes.

## 1. Descoberta e Chaves Públicas (OIDC Discovery)

Estas rotas seguem a RFC 8414 e permitem que os demais microsserviços (*Resource Servers*) validem JWTs localmente em memória (*stateless*), sem necessidade de consultar o banco de dados a cada requisição.

### `GET /.well-known/openid-configuration`

* **Implementação:** 100% automática pelo middleware do OpenIddict.
* **Finalidade:** Expõe o documento JSON de metadados do servidor de autorização. Informa dinamicamente aos clientes as URLs oficiais, o `issuer`, os algoritmos de assinatura (`RS256` / `ES256`), *grant types* e escopos.

### `GET /.well-known/jwks.json`

* **Implementação:** 100% automática pelo middleware do OpenIddict.
* **Finalidade:** Disponibiliza o *JSON Web Key Set* (JWKS) contendo as chaves criptográficas públicas do servidor para validação assimétrica dos `access_token` (JWTs).

## 2. Protocolo Core OAuth 2.0 / OpenID Connect (`/connect`)

Rotas responsáveis pelo ciclo de vida dos tokens e delegação de acesso.

### `GET /connect/authorize`

* **Implementação:** Híbrida (*Passthrough* do OpenIddict + Handler da aplicação).
* **Finalidade:** Inicia o fluxo interativo **Authorization Code + PKCE** (obrigatório pela RFC 9700).
  * O OpenIddict valida os parâmetros da requisição (`client_id`, `redirect_uri`, `response_type=code`, `code_challenge`).
  * A aplicação verifica a sessão temporária do usuário (cookie enxuto gerado no login), constrói o `ClaimsPrincipal` do perfil customizado e devolve o controle ao OpenIddict para emitir o `authorization_code` e redirecionar.

### `POST /connect/token`

* **Implementação:** Híbrida (*Passthrough* do OpenIddict + Handler da aplicação).
* **Finalidade:** Endpoint central para emissão dos JWTs definitivos (`access_token`, `id_token` e `refresh_token`). Suporta:
  1. **`authorization_code`:** Troca o código temporário obtido no `/connect/authorize`, exigindo validação do `code_verifier` (PKCE).
  2. **`refresh_token`:** Emite um novo JWT e um novo `refresh_token` (rotação obrigatória).
  3. **`client_credentials`:** Permite autenticação máquina-a-máquina (M2M) interna.

### `POST /connect/revoke`

* **Implementação:** 100% automática pelo middleware do OpenIddict (RFC 7009).
* **Finalidade:** Invalida imediatamente um `refresh_token` específico.

### `GET /connect/userinfo`

* **Implementação:** Híbrida (*Passthrough* do OpenIddict + Handler da aplicação).
* **Finalidade:** Retorna dados atualizados do perfil a partir das informações contidas na entidade customizada de Usuário, mediante envio do `access_token` com o escopo `openid`.

## 3. Gestão Customizada de Usuários, Sessões e Clientes (`/api`)

Rotas implementadas via Minimal APIs usando um banco de dados próprio (`DbContext` puro) para usuários e os gerenciadores do OpenIddict (`IOpenIddictTokenManager`, `IOpenIddictApplicationManager`).

### Autenticação e Ciclo de Sessão (`/api/auth`)

#### `POST /api/auth/register`

* **Finalidade:** Cria uma nova conta na tabela própria de Usuários. A aplicação valida nome, email e senha, gera e armazena o hash da senha de forma segura com BCrypt.Net e retorna `201 Created` com os dados do usuário sem a senha.

#### `POST /api/auth/login`

* **Finalidade:** Compara as credenciais recebidas com o hash armazenado no banco. Se válidas, estabelece um **cookie de sessão temporário e enxuto**. Este cookie serve estritamente para sinalizar ao endpoint `/connect/authorize` que o usuário é autêntico, permitindo a conclusão do fluxo OAuth.

#### `POST /api/auth/logout`

* **Finalidade:** Encerra a sessão:
  1. Descarta o cookie de autenticação temporário.
  2. Utiliza o `IOpenIddictTokenManager` para localizar e revogar no banco de dados o `refresh_token` vinculado ao ID do usuário.

### Gestão de Clientes (`/api/clients`)

#### `POST /api/clients` e `GET /api/clients`

* **Finalidade:** Registro e consulta de aplicações clientes no OpenIddict (`IOpenIddictApplicationManager`), definindo `client_id`, `redirect_uris` e exigência de PKCE.

## Resumo Consolidado

| Método | Rota | Camada | Gerenciamento | 
| ----- | ----- | ----- | ----- | 
| `GET` | `/.well-known/openid-configuration` | Discovery / OIDC | Automático (OpenIddict) | 
| `GET` | `/.well-known/jwks.json` | Criptografia / JWKS | Automático (OpenIddict) | 
| `GET` | `/connect/authorize` | Protocolo OAuth/OIDC | Híbrido (Passthrough) | 
| `POST` | `/connect/token` | Protocolo OAuth/OIDC | Híbrido (Passthrough) | 
| `POST` | `/connect/revoke` | Protocolo OAuth/OIDC | Automático (OpenIddict) | 
| `GET` | `/connect/userinfo` | Protocolo OIDC | Híbrido (Passthrough) | 
| `POST` | `/api/auth/register` | Gestão de Usuários | Manual (Custom Entity + BCrypt) | 
| `POST` | `/api/auth/login` | Gestão de Identidade | Manual (Cookie temporário) | 
| `POST` | `/api/auth/logout` | Gestão de Sessão | Manual (Cookie + TokenManager) | 
| `GET` / `POST` | `/api/clients` | Gestão de Clientes | Manual (AppManager) | 