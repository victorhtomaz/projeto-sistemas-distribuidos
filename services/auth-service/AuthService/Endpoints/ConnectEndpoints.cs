using System.Security.Claims;
using AuthService.Services;
using Microsoft.AspNetCore;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Http.HttpResults;
using OpenIddict.Abstractions;
using OpenIddict.Server.AspNetCore;

namespace AuthService.Endpoints;

public static class ConnectEndpoints
{
    public static void MapConnectEndpoints(this IEndpointRouteBuilder app)
    {
        var connectGroup = app.MapGroup("/connect")
            .WithTags("Connect");

        connectGroup.MapGet("/authorize", AuthorizeAsync)
            .WithName("Authorize")
            .Produces(StatusCodes.Status302Found);

        connectGroup.MapPost("/token", TokenAsync)
            .WithName("Token")
            .DisableAntiforgery()
            .Produces(StatusCodes.Status200OK)
            .Produces(StatusCodes.Status400BadRequest);

        connectGroup.MapGet("/userinfo", UserInfoAsync)
            .WithName("UserInfo")
            .Produces<IReadOnlyDictionary<string, object>>(StatusCodes.Status200OK)
            .Produces(StatusCodes.Status401Unauthorized)
            .Produces(StatusCodes.Status403Forbidden);
    }

    private static async Task<Results<Ok<IReadOnlyDictionary<string, object>>, ChallengeHttpResult, ForbidHttpResult>>
        UserInfoAsync(
            HttpContext httpContext,
            IConnectService connectService,
            CancellationToken cancellationToken)
    {
        // Valida o access_token Bearer extraído pelo middleware do OpenIddict.
        var authenticateResult = await httpContext.AuthenticateAsync(OpenIddictServerAspNetCoreDefaults.AuthenticationScheme);
        if (!authenticateResult.Succeeded || authenticateResult.Principal is null)
        {
            return TypedResults.Challenge(
                properties: CreateOAuthErrorProperties(
                    OpenIddictConstants.Errors.InvalidToken,
                    "O token de acesso informado é inválido ou está ausente."),
                authenticationSchemes: [OpenIddictServerAspNetCoreDefaults.AuthenticationScheme]);
        }

        var result = await connectService.GetUserInfoAsync(authenticateResult.Principal, cancellationToken);

        if (!result.IsSuccess)
        {
            var properties = CreateOAuthErrorProperties(
                result.ErrorCode ?? OpenIddictConstants.Errors.InvalidToken,
                result.ErrorMessage);

            if (result.ErrorCode == OpenIddictConstants.Errors.InsufficientScope)
            {
                return TypedResults.Forbid(
                    properties: properties,
                    authenticationSchemes: [OpenIddictServerAspNetCoreDefaults.AuthenticationScheme]);
            }

            return TypedResults.Challenge(
                properties: properties,
                authenticationSchemes: [OpenIddictServerAspNetCoreDefaults.AuthenticationScheme]);
        }

        return TypedResults.Ok(result.Claims!);
    }

    private static async Task<Results<SignInHttpResult, ForbidHttpResult>>
        TokenAsync(
            HttpContext httpContext,
            IConnectService connectService,
            CancellationToken cancellationToken)
    {
        var request = httpContext.GetOpenIddictServerRequest()
            ?? throw new InvalidOperationException("Não foi possível recuperar a requisição OpenID Connect.");

        ClaimsPrincipal? tokenPrincipal = null;

        if (request.IsAuthorizationCodeGrantType() || request.IsRefreshTokenGrantType())
        {
            // Recupera o ClaimsPrincipal contido no authorization_code ou refresh_token já validado pelo OpenIddict.
            var authenticateResult = await httpContext.AuthenticateAsync(OpenIddictServerAspNetCoreDefaults.AuthenticationScheme);
            tokenPrincipal = authenticateResult.Principal;
        }

        var result = await connectService.ExchangeTokenAsync(request, tokenPrincipal, cancellationToken);

        if (!result.IsSuccess)
        {
            return TypedResults.Forbid(
                properties: CreateOAuthErrorProperties(
                    result.ErrorCode ?? OpenIddictConstants.Errors.InvalidGrant,
                    result.ErrorMessage),
                authenticationSchemes: [OpenIddictServerAspNetCoreDefaults.AuthenticationScheme]);
        }

        // Devolve o ClaimsPrincipal ao OpenIddict para assinar e retornar os tokens (access_token, id_token e refresh_token).
        return TypedResults.SignIn(
            principal: result.Principal!,
            properties: null,
            authenticationScheme: OpenIddictServerAspNetCoreDefaults.AuthenticationScheme);
    }

    private static async Task<Results<SignInHttpResult, ChallengeHttpResult>>
        AuthorizeAsync(
            HttpContext httpContext,
            IConnectService connectService,
            CancellationToken cancellationToken)
    {
        var request = httpContext.GetOpenIddictServerRequest()
            ?? throw new InvalidOperationException("Não foi possível recuperar a requisição OpenID Connect.");

        // Verifica o cookie de sessão temporário gerado no endpoint de login.
        var authenticateResult = await httpContext.AuthenticateAsync(CookieAuthenticationDefaults.AuthenticationScheme);

        var result = await connectService.AuthorizeAsync(
            authenticateResult.Principal,
            request.GetScopes(),
            cancellationToken);

        if (result.IsUnauthorized)
        {
            if (authenticateResult.Succeeded)
            {
                // Remove o cookie caso a sessão aponte para um usuário que não existe mais no banco.
                await httpContext.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme);
            }

            // Redireciona o cliente para a rota de login preservando a URL original de autorização no ReturnUrl.
            var redirectUri = httpContext.Request.PathBase + httpContext.Request.Path + httpContext.Request.QueryString;

            return TypedResults.Challenge(
                properties: new AuthenticationProperties { RedirectUri = redirectUri },
                authenticationSchemes: [CookieAuthenticationDefaults.AuthenticationScheme]);
        }

        // Devolve o ClaimsPrincipal ao OpenIddict para emitir o authorization_code e redirecionar ao redirect_uri.
        return TypedResults.SignIn(
            principal: result.Principal!,
            properties: null,
            authenticationScheme: OpenIddictServerAspNetCoreDefaults.AuthenticationScheme);
    }

    private static AuthenticationProperties CreateOAuthErrorProperties(string errorCode, string? errorDescription) =>
        new(new Dictionary<string, string?>
        {
            [OpenIddictServerAspNetCoreConstants.Properties.Error] = errorCode,
            [OpenIddictServerAspNetCoreConstants.Properties.ErrorDescription] = errorDescription
        });
}

