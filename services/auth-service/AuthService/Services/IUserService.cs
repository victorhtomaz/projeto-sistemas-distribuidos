using AuthService.DTOs;

namespace AuthService.Services;

public interface IUserService
{
    Task<RegisterUserResult> RegisterAsync(RegisterRequest request, CancellationToken cancellationToken);

    Task<LoginUserResult> LoginAsync(LoginRequest request, CancellationToken cancellationToken);
}

public sealed record RegisterUserResult : IServiceResult
{
    public bool IsSuccess { get; init; }

    public IDictionary<string, string[]>? ValidationErrors { get; init; }

    public bool IsConflict { get; init; }

    public string? ErrorMessage { get; init; }

    public static RegisterUserResult Success() =>
        new() { IsSuccess = true };

    public static RegisterUserResult ValidationFailure(IDictionary<string, string[]> errors) =>
        new() { ValidationErrors = errors };

    public static RegisterUserResult Conflict(string errorMessage) =>
        new() { IsConflict = true, ErrorMessage = errorMessage };
}

public sealed record LoginUserResult : IServiceResult
{
    public bool IsSuccess { get; init; }

    public UserResponse? User { get; init; }

    public IDictionary<string, string[]>? ValidationErrors { get; init; }

    public bool IsUnauthorized { get; init; }

    public string? ErrorMessage { get; init; }

    public static LoginUserResult Success(UserResponse user) =>
        new() { IsSuccess = true, User = user };

    public static LoginUserResult ValidationFailure(IDictionary<string, string[]> errors) =>
        new() { ValidationErrors = errors };

    public static LoginUserResult Unauthorized(string errorMessage) =>
        new() { IsUnauthorized = true, ErrorMessage = errorMessage };
}

