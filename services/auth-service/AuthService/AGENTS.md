# Diretrizes do Projeto .NET (AGENTS.md)

Este documento define os padrões arquiteturais e de codificação essenciais para este microsserviço em .NET. Todos os desenvolvedores e agentes de IA DEVEM seguir estas regras ao gerar, refatorar ou revisar o código.

## 1. Idioma e Nomenclatura
* **Inglês no Código e Português em Comentários e Respostas:** Os artefatos estruturais de código DEVEM ser escritos em inglês, enquanto **comentários no código e mensagens de resposta enviadas pelas rotas DEVEM ser escritos em português**.
  * **Em inglês:** Classes, interfaces, records, métodos, propriedades, variáveis, rotas de API, chaves de payloads JSON, esquemas de banco de dados, documentação XML e mensagens de commit.
  * **Em português:** Comentários no código e textos/mensagens das respostas HTTP enviadas pelas rotas (ex: mensagens de sucesso, erro ou validação).
* **Padrões de Nomenclatura (Casing):**
  * `PascalCase` para Classes, Records, Interfaces, Métodos e Propriedades.
  * `camelCase` para variáveis locais e parâmetros de métodos.
  * `_camelCase` para campos privados de leitura (`private readonly` ex: `_dbContext`).

## 2. Arquitetura da API (Minimal APIs)
* **Estritamente Minimal APIs:** NÃO utilize os tradicionais Controllers do ASP.NET Core MVC (`ControllerBase`, `[ApiController]`). Todos os endpoints HTTP devem ser implementados usando Minimal APIs.
* **Grupos de Rotas (Route Groups):** Agrupe endpoints relacionados usando `MapGroup` para aplicar prefixos comuns, tags ou middlewares (ex: `var authGroup = app.MapGroup("/api/auth").WithTags("Auth");`).
* **Modularidade de Endpoints:** Mantenha o `Program.cs` limpo, extraindo o mapeamento de endpoints para métodos de extensão (ex: `public static void MapAuthEndpoints(this IEndpointRouteBuilder app)`).
* **Desacoplamento entre Endpoint e Lógica de Negócio:** Os handlers dos endpoints NÃO devem conter regras de negócio diretamente; eles devem apenas receber a requisição, acionar o serviço correspondente e retornar a resposta HTTP. Todo o fluxo e a lógica de negócio DEVEM ser implementados em uma classe de serviço em `/Services` (ex: `UserService`), injetada no endpoint via Injeção de Dependência.
* **Typed Results:** Sempre retorne respostas HTTP utilizando `TypedResults` (ex: `TypedResults.Ok(data)`, `TypedResults.BadRequest(error)`) para garantir tipagem forte e documentação OpenAPI/Swagger precisa.

## 3. Estrutura do Projeto (Projeto Único)
* Mantenha um único arquivo `.csproj` por microsserviço para minimizar a complexidade.
* Organize os arquivos logicamente por pastas:
  * `/Endpoints`: Definições de rotas e manipuladores (handlers) de Minimal APIs.
  * `/Models`: Entidades de domínio, Enums e Constantes.
  * `/DTOs`: Objetos de Transferência de Dados (use o tipo `record`).
  * `/Data`: Configurações do Entity Framework Core, `DbContext` e Migrations.
  * `/Services`: Regras de negócio, geração de tokens e integrações externas.
  * `/Extensions`: Configurações de Injeção de Dependência (DI) e métodos de extensão de configuração.

## 4. Recursos Modernos do C#
* **Records para DTOs:** Use `record` ou `record struct` para todas as requisições (requests) e respostas (responses) para garantir imutabilidade.
* **Construtores Primários (Primary Constructors):** Use os construtores primários do C# 12+ para Injeção de Dependência em serviços e endpoints.
* **Namespaces em Nível de Arquivo:** Use namespaces sem chaves (ex: `namespace MyService.Folder;`).
* **Usings Implícitos (Implicit Usings):** Confie nos usings globais gerados automaticamente; não polua os arquivos com declarações padrão como `using System;`.

## 5. Performance e Boas Práticas
* **Programação Assíncrona:** Sempre use `async`/`await` para operações que envolvem I/O (consultas do EF Core, chamadas HTTP).
* **Tokens de Cancelamento (Cancellation Tokens):** Sempre passe o `CancellationToken` para métodos assíncronos para permitir o cancelamento da requisição se o cliente desconectar.
* **Tratamento de Erros Global:** Não use `try/catch` nos endpoints para o fluxo normal de exceções. Utilize o `IExceptionHandler` nativo do .NET 8+ para retornar `ProblemDetails` padronizados.