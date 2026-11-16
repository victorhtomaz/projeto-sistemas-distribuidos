namespace AuthService.Services;

/// <summary>
/// Common contract for service operation results across application routes.
/// </summary>
public interface IServiceResult
{
    bool IsSuccess { get; }

    IDictionary<string, string[]>? ValidationErrors { get; }

    string? ErrorMessage { get; }
}

