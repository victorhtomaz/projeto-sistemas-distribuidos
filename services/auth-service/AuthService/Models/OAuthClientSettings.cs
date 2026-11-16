namespace AuthService.Models;

public sealed class OAuthClientSettings
{
    public string ClientId { get; init; } = string.Empty;

    public string? ClientSecret { get; init; }

    public string DisplayName { get; init; } = string.Empty;

    public List<string> RedirectUris { get; init; } = [];

    public List<string> PostLogoutRedirectUris { get; init; } = [];

    public List<string> GrantTypes { get; init; } = [];

    public List<string> Scopes { get; init; } = [];

    public bool RequirePkce { get; init; } = true;
}

