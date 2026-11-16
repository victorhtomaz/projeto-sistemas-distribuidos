using System.Collections.Immutable;
using System.Security.Claims;
using AuthService.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using OpenIddict.Abstractions;
using static OpenIddict.Abstractions.OpenIddictConstants;

namespace AuthService.Services;

public sealed class ConnectService(
    ApplicationDbContext dbContext,
    IOpenIddictApplicationManager applicationManager) : IConnectService
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

        var principal = CreateUserPrincipal(user.Id, user.Name, user.Email, requestedScopes);
        return AuthorizeResult.Success(principal);
    }

    public async Task<TokenExchangeResult> ExchangeTokenAsync(
        OpenIddictRequest request,
        ClaimsPrincipal? tokenPrincipal,
        CancellationToken cancellationToken)
    {
        if (request.IsAuthorizationCodeGrantType() || request.IsRefreshTokenGrantType())
        {
            return await ExchangeUserTokenAsync(request, tokenPrincipal, cancellationToken);
        }

        if (request.IsClientCredentialsGrantType())
        {
            return await ExchangeClientCredentialsAsync(request, cancellationToken);
        }

        return TokenExchangeResult.Fail(
            Errors.UnsupportedGrantType,
            "O tipo de concessão (grant_type) especificado não é suportado.");
    }

    public async Task<UserInfoResult> GetUserInfoAsync(
        ClaimsPrincipal tokenPrincipal,
        CancellationToken cancellationToken)
    {
        if (!tokenPrincipal.HasScope(Scopes.OpenId))
        {
            return UserInfoResult.Fail(
                Errors.InsufficientScope,
                "O token de acesso não possui o escopo 'openid' exigido.");
        }

        var subjectClaim = tokenPrincipal.GetClaim(Claims.Subject);
        if (!Guid.TryParse(subjectClaim, out var userId))
        {
            return UserInfoResult.Fail(
                Errors.InvalidToken,
                "O identificador do usuário no token é inválido.");
        }

        // Consulta os dados atualizados do usuário na base customizada para compor o perfil UserInfo.
        var user = await dbContext.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(existingUser => existingUser.Id == userId, cancellationToken);

        if (user is null)
        {
            return UserInfoResult.Fail(
                Errors.InvalidToken,
                "O usuário associado ao token não foi encontrado.");
        }

        var claims = new Dictionary<string, object>(StringComparer.Ordinal)
        {
            [Claims.Subject] = user.Id.ToString()
        };

        if (tokenPrincipal.HasScope(Scopes.Profile))
        {
            claims[Claims.Name] = user.Name;
        }

        if (tokenPrincipal.HasScope(Scopes.Email))
        {
            claims[Claims.Email] = user.Email;
        }

        return UserInfoResult.Success(claims);
    }

    private async Task<TokenExchangeResult> ExchangeUserTokenAsync(
        OpenIddictRequest request,
        ClaimsPrincipal? tokenPrincipal,
        CancellationToken cancellationToken)
    {
        var subjectClaim = tokenPrincipal?.GetClaim(Claims.Subject);
        if (!Guid.TryParse(subjectClaim, out var userId))
        {
            return TokenExchangeResult.Fail(
                Errors.InvalidGrant,
                "O código de autorização ou refresh token informado não é mais válido.");
        }

        // Reconsulta o usuário no banco para garantir que ele ainda existe e atualizar as claims emitidas nos novos tokens.
        var user = await dbContext.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(existingUser => existingUser.Id == userId, cancellationToken);

        if (user is null)
        {
            return TokenExchangeResult.Fail(
                Errors.InvalidGrant,
                "O usuário associado ao token não foi encontrado.");
        }

        // Preserva os escopos do código/refresh token original ou aplica downscoping caso solicitado no refresh_token.
        var scopes = request.IsRefreshTokenGrantType() && !request.GetScopes().IsDefaultOrEmpty
            ? request.GetScopes()
            : tokenPrincipal!.GetScopes();

        var principal = CreateUserPrincipal(
            user.Id,
            user.Name,
            user.Email,
            scopes,
            tokenPrincipal!.GetResources());

        return TokenExchangeResult.Success(principal);
    }

    private async Task<TokenExchangeResult> ExchangeClientCredentialsAsync(
        OpenIddictRequest request,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.ClientId))
        {
            return TokenExchangeResult.Fail(
                Errors.InvalidClient,
                "As credenciais da aplicação cliente não foram informadas.");
        }

        var application = await applicationManager.FindByClientIdAsync(request.ClientId, cancellationToken);
        if (application is null)
        {
            return TokenExchangeResult.Fail(
                Errors.InvalidClient,
                "A aplicação cliente informada não foi encontrada.");
        }

        var clientId = await applicationManager.GetClientIdAsync(application, cancellationToken) ?? request.ClientId;
        var displayName = await applicationManager.GetDisplayNameAsync(application, cancellationToken) ?? clientId;

        var identity = new ClaimsIdentity(
            authenticationType: TokenValidationParameters.DefaultAuthenticationType,
            nameType: Claims.Name,
            roleType: Claims.Role);

        identity.SetClaim(Claims.Subject, clientId)
            .SetClaim(Claims.Name, displayName);

        identity.SetScopes(request.GetScopes());
        identity.SetDestinations(GetDestinations);

        return TokenExchangeResult.Success(new ClaimsPrincipal(identity));
    }

    private static ClaimsPrincipal CreateUserPrincipal(
        Guid userId,
        string name,
        string email,
        ImmutableArray<string> scopes,
        ImmutableArray<string> resources = default)
    {
        // Constrói a identidade OIDC que será assinada pelo OpenIddict para emissão dos tokens.
        var identity = new ClaimsIdentity(
            authenticationType: TokenValidationParameters.DefaultAuthenticationType,
            nameType: Claims.Name,
            roleType: Claims.Role);

        identity.SetClaim(Claims.Subject, userId.ToString())
            .SetClaim(Claims.Name, name)
            .SetClaim(Claims.Email, email);

        identity.SetScopes(scopes);

        if (!resources.IsDefaultOrEmpty)
        {
            identity.SetResources(resources);
        }

        identity.SetDestinations(GetDestinations);

        return new ClaimsPrincipal(identity);
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

