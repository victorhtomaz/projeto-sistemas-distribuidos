using System.Collections.Immutable;
using System.Security.Claims;
using OpenIddict.Abstractions;

namespace AuthService.Services;

public interface IConnectService
{
    Task<AuthorizeResult> AuthorizeAsync(
        ClaimsPrincipal? cookiePrincipal,
        ImmutableArray<string> requestedScopes,
        CancellationToken cancellationToken);

    Task<TokenExchangeResult> ExchangeTokenAsync(
        OpenIddictRequest request,
        ClaimsPrincipal? tokenPrincipal,
        CancellationToken cancellationToken);

    Task<UserInfoResult> GetUserInfoAsync(
        ClaimsPrincipal tokenPrincipal,
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

public sealed record TokenExchangeResult : IServiceResult
{
    public bool IsSuccess { get; init; }

    public ClaimsPrincipal? Principal { get; init; }

    public IDictionary<string, string[]>? ValidationErrors { get; init; }

    public string? ErrorCode { get; init; }

    public string? ErrorMessage { get; init; }

    public static TokenExchangeResult Success(ClaimsPrincipal principal) =>
        new() { IsSuccess = true, Principal = principal };

    public static TokenExchangeResult Fail(string errorCode, string errorMessage) =>
        new() { IsSuccess = false, ErrorCode = errorCode, ErrorMessage = errorMessage };
}

public sealed record UserInfoResult : IServiceResult
{
    public bool IsSuccess { get; init; }

    public IReadOnlyDictionary<string, object>? Claims { get; init; }

    public IDictionary<string, string[]>? ValidationErrors { get; init; }

    public string? ErrorCode { get; init; }

    public string? ErrorMessage { get; init; }

    public static UserInfoResult Success(IReadOnlyDictionary<string, object> claims) =>
        new() { IsSuccess = true, Claims = claims };

    public static UserInfoResult Fail(string errorCode, string errorMessage) =>
        new() { IsSuccess = false, ErrorCode = errorCode, ErrorMessage = errorMessage };
}

