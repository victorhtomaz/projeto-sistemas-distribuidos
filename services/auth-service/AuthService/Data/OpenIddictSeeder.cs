using AuthService.Models;
using OpenIddict.Abstractions;
using static OpenIddict.Abstractions.OpenIddictConstants;

namespace AuthService.Data;

public sealed class OpenIddictSeeder(
    IServiceProvider serviceProvider,
    IConfiguration configuration) : IHostedService
{
    public async Task StartAsync(CancellationToken cancellationToken)
    {
        // Lê a lista de aplicações clientes OAuth/OIDC configuradas no appsettings.json.
        var clients = configuration.GetSection("OpenIddict:Clients").Get<List<OAuthClientSettings>>();
        if (clients is null || clients.Count == 0)
        {
            return;
        }

        await using var scope = serviceProvider.CreateAsyncScope();
        var applicationManager = scope.ServiceProvider.GetRequiredService<IOpenIddictApplicationManager>();

        foreach (var client in clients)
        {
            if (string.IsNullOrWhiteSpace(client.ClientId))
            {
                continue;
            }

            var descriptor = BuildApplicationDescriptor(client);
            var existingClient = await applicationManager.FindByClientIdAsync(client.ClientId, cancellationToken);

            // Cria o cliente caso ainda não exista ou atualiza suas configurações no banco de dados.
            if (existingClient is null)
            {
                await applicationManager.CreateAsync(descriptor, cancellationToken);
            }
            else
            {
                await applicationManager.UpdateAsync(existingClient, descriptor, cancellationToken);
            }
        }
    }

    public Task StopAsync(CancellationToken cancellationToken) => Task.CompletedTask;

    private static OpenIddictApplicationDescriptor BuildApplicationDescriptor(OAuthClientSettings client)
    {
        var descriptor = new OpenIddictApplicationDescriptor
        {
            ClientId = client.ClientId.Trim(),
            ClientSecret = string.IsNullOrWhiteSpace(client.ClientSecret) ? null : client.ClientSecret,
            DisplayName = string.IsNullOrWhiteSpace(client.DisplayName) ? client.ClientId.Trim() : client.DisplayName.Trim(),
            ClientType = string.IsNullOrWhiteSpace(client.ClientSecret)
                ? ClientTypes.Public
                : ClientTypes.Confidential,
            ConsentType = ConsentTypes.Implicit
        };

        foreach (var redirectUri in client.RedirectUris)
        {
            if (Uri.TryCreate(redirectUri, UriKind.Absolute, out var parsedUri))
            {
                descriptor.RedirectUris.Add(parsedUri);
            }
        }

        foreach (var postLogoutUri in client.PostLogoutRedirectUris)
        {
            if (Uri.TryCreate(postLogoutUri, UriKind.Absolute, out var parsedUri))
            {
                descriptor.PostLogoutRedirectUris.Add(parsedUri);
            }
        }

        foreach (var grantType in client.GrantTypes)
        {
            switch (grantType.Trim().ToLowerInvariant())
            {
                case GrantTypes.AuthorizationCode:
                    descriptor.Permissions.Add(Permissions.Endpoints.Authorization);
                    descriptor.Permissions.Add(Permissions.Endpoints.Token);
                    descriptor.Permissions.Add(Permissions.Endpoints.Revocation);
                    descriptor.Permissions.Add(Permissions.GrantTypes.AuthorizationCode);
                    descriptor.Permissions.Add(Permissions.ResponseTypes.Code);
                    break;

                case GrantTypes.RefreshToken:
                    descriptor.Permissions.Add(Permissions.Endpoints.Token);
                    descriptor.Permissions.Add(Permissions.Endpoints.Revocation);
                    descriptor.Permissions.Add(Permissions.GrantTypes.RefreshToken);
                    break;

                case GrantTypes.ClientCredentials:
                    descriptor.Permissions.Add(Permissions.Endpoints.Token);
                    descriptor.Permissions.Add(Permissions.GrantTypes.ClientCredentials);
                    break;
            }
        }

        foreach (var scope in client.Scopes)
        {
            if (!string.IsNullOrWhiteSpace(scope))
            {
                descriptor.Permissions.Add(Permissions.Prefixes.Scope + scope.Trim());
            }
        }

        if (client.RequirePkce)
        {
            descriptor.Requirements.Add(Requirements.Features.ProofKeyForCodeExchange);
        }

        return descriptor;
    }
}

