using System.Collections.Immutable;
using System.Security.Claims;
using AuthService.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using OpenIddict.Abstractions;
using static OpenIddict.Abstractions.OpenIddictConstants;

namespace AuthService.Services;

public sealed class ConnectService(ApplicationDbContext dbContext) : IConnectService
{
    public async Task<AuthorizeResult> AuthorizeAsync(
        ClaimsPrincipal? cookiePrincipal,
        ImmutableArray<string> requestedScopes,
        CancellationToken cancellationToken)
    {
        // Verifica se o cookie de sessão temporário possui uma identidade autenticada e um ID de usuário válido.
        var userIdClaim = cookiePrincipal?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (cookiePrincipal?.Identity?.IsAuthenticated != true || !Guid.TryParse(userIdClaim, out var userId))
        {
            return AuthorizeResult.Unauthorized("Sessão de usuário não encontrada ou expirada.");
        }

        // Consulta o usuário no banco de dados para garantir que a conta continua ativa e obter dados atualizados.
        var user = await dbContext.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(existingUser => existingUser.Id == userId, cancellationToken);

        if (user is null)
        {
            return AuthorizeResult.Unauthorized("Usuário associado à sessão não foi encontrado.");
        }

        // Constrói a identidade OIDC que será assinada pelo OpenIddict para emissão do authorization_code.
        var identity = new ClaimsIdentity(
            authenticationType: TokenValidationParameters.DefaultAuthenticationType,
            nameType: Claims.Name,
            roleType: Claims.Role);

        identity.SetClaim(Claims.Subject, user.Id.ToString())
            .SetClaim(Claims.Name, user.Name)
            .SetClaim(Claims.Email, user.Email);

        identity.SetScopes(requestedScopes);
        identity.SetDestinations(GetDestinations);

        var principal = new ClaimsPrincipal(identity);
        return AuthorizeResult.Success(principal);
    }

    private static IEnumerable<string> GetDestinations(Claim claim)
    {
        // Define em quais tokens (access_token e/ou id_token) cada claim será incluída com base nos escopos concedidos.
        switch (claim.Type)
        {
            case Claims.Name:
                yield return Destinations.AccessToken;

                if (claim.Subject is not null && claim.Subject.HasScope(Scopes.Profile))
                {
                    yield return Destinations.IdentityToken;
                }

                yield break;

            case Claims.Email:
                yield return Destinations.AccessToken;

                if (claim.Subject is not null && claim.Subject.HasScope(Scopes.Email))
                {
                    yield return Destinations.IdentityToken;
                }

                yield break;

            default:
                yield return Destinations.AccessToken;
                yield break;
        }
    }
}

