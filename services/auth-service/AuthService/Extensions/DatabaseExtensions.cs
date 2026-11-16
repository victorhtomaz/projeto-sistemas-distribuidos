using AuthService.Data;
using Microsoft.EntityFrameworkCore;

namespace AuthService.Extensions;

public static class DatabaseExtensions
{
    public static async Task ApplyMigrationsAsync(
        this WebApplication app,
        CancellationToken cancellationToken = default)
    {
        await using var scope = app.Services.CreateAsyncScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        var logger = scope.ServiceProvider.GetRequiredService<ILoggerFactory>()
            .CreateLogger("AuthService.DatabaseMigrations");

        var pendingMigrations = await dbContext.Database.GetPendingMigrationsAsync(cancellationToken);
        var pendingList = pendingMigrations.ToList();

        if (pendingList.Count == 0)
        {
            logger.LogInformation("Nenhuma migração pendente encontrada.");
            return;
        }

        logger.LogInformation("Aplicando {Count} migração(ões) pendente(s)...", pendingList.Count);
        await dbContext.Database.MigrateAsync(cancellationToken);
        logger.LogInformation("Migrações aplicadas com sucesso.");
    }
}

