using System.Collections.Immutable;
using System.Security.Claims;

namespace AuthService.Services;

public interface IConnectService
{
    Task<AuthorizeResult> AuthorizeAsync(
        ClaimsPrincipal? cookiePrincipal,
        ImmutableArray<string> requestedScopes,
        CancellationToken cancellationToken);
}

public sealed record AuthorizeResult : IServiceResult
{
    public bool IsSuccess { get; init; }

    public ClaimsPrincipal? Principal { get; init; }

    public IDictionary<string, string[]>? ValidationErrors { get; init; }

    public bool IsUnauthorized { get; init; }

    public string? ErrorMessage { get; init; }

    public static AuthorizeResult Success(ClaimsPrincipal principal) =>
        new() { IsSuccess = true, Principal = principal };

    public static AuthorizeResult Unauthorized(string errorMessage) =>
        new() { IsUnauthorized = true, ErrorMessage = errorMessage };
}

