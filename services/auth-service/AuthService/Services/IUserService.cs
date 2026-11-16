using AuthService.DTOs;

namespace AuthService.Services;

public interface IUserService
{
    Task<RegisterUserResult> RegisterAsync(RegisterRequest request, CancellationToken cancellationToken);
}

public sealed record RegisterUserResult
{
    public UserResponse? User { get; init; }

    public IDictionary<string, string[]>? ValidationErrors { get; init; }

    public bool IsConflict { get; init; }

    public string? ErrorMessage { get; init; }

    public static RegisterUserResult Success(UserResponse user) =>
        new() { User = user };

    public static RegisterUserResult ValidationFailure(IDictionary<string, string[]> errors) =>
        new() { ValidationErrors = errors };

    public static RegisterUserResult Conflict(string errorMessage) =>
        new() { IsConflict = true, ErrorMessage = errorMessage };
}

