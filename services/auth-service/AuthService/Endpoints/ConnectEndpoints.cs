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
}

