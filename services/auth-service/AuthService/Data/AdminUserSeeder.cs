using AuthService.Models;
using Microsoft.EntityFrameworkCore;

namespace AuthService.Data;

public sealed class AdminUserSeeder(
    IServiceProvider serviceProvider,
    IConfiguration configuration,
    ILogger<AdminUserSeeder> logger) : IHostedService
{
    public async Task StartAsync(CancellationToken cancellationToken)
    {
        // Lê as configurações da conta inicial de administrador definidas no appsettings.json.
        var adminSettings = configuration.GetSection("AdminSeed").Get<AdminSeedSettings>();
        if (adminSettings is null ||
            string.IsNullOrWhiteSpace(adminSettings.Email) ||
            string.IsNullOrWhiteSpace(adminSettings.Password))
        {
            return;
        }

        await using var scope = serviceProvider.CreateAsyncScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

        var normalizedEmail = adminSettings.Email.Trim().ToLowerInvariant();
        var existingUser = await dbContext.Users
            .FirstOrDefaultAsync(user => user.Email == normalizedEmail, cancellationToken);

        if (existingUser is null)
        {
            var adminUser = new User
            {
                Id = Guid.NewGuid(),
                Name = string.IsNullOrWhiteSpace(adminSettings.Name) ? "Administrador" : adminSettings.Name.Trim(),
                Email = normalizedEmail,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(adminSettings.Password),
                Role = UserRole.Admin
            };

            dbContext.Users.Add(adminUser);
            await dbContext.SaveChangesAsync(cancellationToken);
            logger.LogInformation("Usuário administrador padrão criado com sucesso ({Email}).", normalizedEmail);
        }
        else if (existingUser.Role != UserRole.Admin)
        {
            // Garante que a conta configurada no seed possua o papel de administrador.
            existingUser.Role = UserRole.Admin;
            await dbContext.SaveChangesAsync(cancellationToken);
            logger.LogInformation("Papel de administrador atribuído ao usuário existente ({Email}).", normalizedEmail);
        }
    }

    public Task StopAsync(CancellationToken cancellationToken) => Task.CompletedTask;
}

