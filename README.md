# Sistemas Distribuídos — Autenticação e Monitoramento

Sistema composto por um microsserviço de autenticação e autorização OAuth 2.0 / OpenID Connect (`AuthService`), um banco de dados PostgreSQL e uma aplicação web frontend (`Monitoramento`), orquestrados via Docker Compose.

---

## Como o sistema funciona

A arquitetura é dividida em três serviços principais conectados na rede `app-network`:

1. **`postgres` (`postgres:18-alpine`)**
   - Armazena os dados de usuários, aplicações clientes, autorizações e tokens do OpenIddict no banco `auth_service` (porta padrão `5432`).

2. **`auth-service` (`services/auth-service/AuthService`)**
   - Microsserviço em **.NET 10 (Minimal APIs)** com **OpenIddict**, **Entity Framework Core + PostgreSQL** e **BCrypt.Net**.
   - Na inicialização, aplica automaticamente as *migrations* no banco (`ApplyMigrationsAsync`), cadastra o cliente OAuth/OIDC `web-client` (`OpenIddictSeeder`) e cria o usuário administrador padrão (`AdminUserSeeder`).
   - Expõe endpoints de gestão de sessão (`/auth/register`, `/auth/login`, `/auth/logout`), protocolo OAuth 2.0 / OIDC (`/connect/authorize`, `/connect/token`, `/connect/revoke`, `/connect/userinfo`) e descoberta/chaves públicas (`/.well-known/openid-configuration`, `/.well-known/jwks`).
   - Escuta internamente nas portas `8080` (HTTP) e `8081` (HTTPS).

3. **`monitoramento` (`frontend/monitoramento`)**
   - Aplicação SPA em **Vite + Vanilla JS + Tailwind CSS + `oidc-client-ts`**, compilada e servida via **Nginx** na porta `80` (exposta no host na porta `3000` por padrão).
   - O Nginx realiza o fallback das rotas da SPA (`/`, `/login`, `/register`, `/callback`) e atua como proxy reverso para `/auth/`, `/connect/` e `/.well-known/`, encaminhando essas chamadas para `AUTH_SERVICE_URL` (`https://auth-service:8081`). Isso mantém a comunicação do navegador na mesma origem (`http://localhost:3000`).

### Fluxo de autenticação (Authorization Code + PKCE)

1. Ao acessar `http://localhost:3000`, o frontend inicia o fluxo OAuth 2.0 / OIDC via `GET /connect/authorize`.
2. Se não houver o cookie de sessão temporária `.AuthService.Session`, o `AuthService` redireciona o navegador para `AUTH_LOGIN_URL` (`http://localhost:3000/login`).
3. O usuário informa as credenciais em `POST /auth/login`; o serviço valida a senha, emite o cookie de sessão e o navegador retorna a `/connect/authorize`.
4. O `AuthService` emite o `authorization_code` e redireciona para `http://localhost:3000/callback`.
5. O frontend troca o código pelos tokens (`access_token`, `id_token` e `refresh_token`) em `POST /connect/token` validando o PKCE.

Para mais detalhes sobre os endpoints e contratos, consulte [docs/auth-service.md](docs/auth-service.md).

---

## Pré-requisitos

- **Docker** e **Docker Compose**
- **.NET SDK 10** (ou **OpenSSL**) para gerar o certificado HTTPS de desenvolvimento

---

## Passo a passo para inicialização

### 1. Gerar o certificado HTTPS em `certs/`

O `auth-service` monta o diretório `./certs` em `/https:ro` e utiliza o certificado `/https/aspnetapp.pfx` no Kestrel (`AUTH_KESTREL_CERT_PATH`), protegido pela senha configurada em `AUTH_KESTREL_CERT_PASSWORD` (padrão: `dev-cert-password`).

Gere o arquivo `certs/aspnetapp.pfx` utilizando **uma** das opções abaixo a partir da raiz do repositório:

**Opção A — via .NET CLI:**
```bash
dotnet dev-certs https -ep ./certs/aspnetapp.pfx -p dev-cert-password
```

**Opção B — via OpenSSL:**
```bash
openssl req -x509 -newkey rsa:2048 -nodes -keyout ./certs/aspnetapp.key -out ./certs/aspnetapp.crt -days 365 -subj "/CN=localhost"
openssl pkcs12 -export -out ./certs/aspnetapp.pfx -inkey ./certs/aspnetapp.key -in ./certs/aspnetapp.crt -password pass:dev-cert-password
```

> **Nota para produção:** Quando `ASPNETCORE_ENVIRONMENT=Production`, além do certificado do Kestrel, o OpenIddict exige certificados PKCS#12 dedicados para assinatura e criptografia configurados via `OPENIDDICT_SIGNING_CERT_PATH`, `OPENIDDICT_SIGNING_CERT_PASSWORD`, `OPENIDDICT_ENCRYPTION_CERT_PATH` e `OPENIDDICT_ENCRYPTION_CERT_PASSWORD`.

### 2. Configurar as variáveis de ambiente

Crie o arquivo `.env` na raiz do projeto a partir do modelo `.env.example` (caso ainda não exista) e ajuste os valores se necessário:

```bash
cp .env.example .env
```

### 3. Subir os containers

Na raiz do repositório, execute:

```bash
docker compose up --build -d
```

Após a inicialização, os serviços estarão disponíveis nos seguintes endereços:

- **Frontend (Monitoramento):** `http://localhost:3000`
- **AuthService (HTTP):** `http://localhost:8080`
- **AuthService (HTTPS):** `https://localhost:8081`
- **PostgreSQL:** `localhost:5432`

**Credenciais iniciais do administrador (criadas automaticamente via seed):**
- **E-mail:** `admin@authservice.local` (definido por `ADMIN_SEED_EMAIL`)
- **Senha:** `AdminPassword123!` (definida por `ADMIN_SEED_PASSWORD`)

### 4. Parar os containers

```bash
docker compose down
```

Para remover também o volume de dados do PostgreSQL:

```bash
docker compose down -v
```
