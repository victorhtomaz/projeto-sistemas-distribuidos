using AuthService.Data;
using AuthService.Services;

namespace AuthService.Extensions;

public static class ServiceCollectionExtensions
{
    public static IServiceCollection AddApplicationServices(this IServiceCollection services)
    {
        // Registra o tratamento global de exceções com ProblemDetails padronizado.
        services.AddProblemDetails();
        services.AddExceptionHandler<GlobalExceptionHandler>();

        // Registra os serviços de regra de negócio da aplicação.
        services.AddScoped<IUserService, UserService>();
        services.AddScoped<IConnectService, ConnectService>();

        // Registra o seeder de aplicações clientes OAuth/OIDC do OpenIddict.
        services.AddHostedService<OpenIddictSeeder>();

        return services;
    }
}

