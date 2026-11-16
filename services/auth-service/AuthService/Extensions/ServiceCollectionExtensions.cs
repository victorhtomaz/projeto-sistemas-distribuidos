using AuthService.Services;

namespace AuthService.Extensions;

public static class ServiceCollectionExtensions
{
    public static IServiceCollection AddApplicationServices(this IServiceCollection services)
    {
        // Registra os serviços de regra de negócio da aplicação.
        services.AddScoped<IUserService, UserService>();

        return services;
    }
}

