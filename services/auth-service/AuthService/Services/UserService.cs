using System.ComponentModel.DataAnnotations;
using AuthService.Data;
using AuthService.DTOs;
using AuthService.Models;
using Microsoft.EntityFrameworkCore;
using OpenIddict.Abstractions;
using static OpenIddict.Abstractions.OpenIddictConstants;

namespace AuthService.Services;

public sealed class UserService(
    ApplicationDbContext dbContext,
    IOpenIddictTokenManager tokenManager) : IUserService
{
    public async Task<RegisterUserResult> RegisterAsync(RegisterRequest request, CancellationToken cancellationToken)
    {
        // Valida os atributos de entrada do DTO antes de acessar o banco de dados.
        var validationErrors = ValidateRequest(request);
        if (validationErrors is not null)
        {
            return RegisterUserResult.ValidationFailure(validationErrors);
        }

        // Normaliza o e-mail para evitar duplicidades por diferença de maiúsculas/minúsculas ou espaços.
        var normalizedEmail = request.Email.Trim().ToLowerInvariant();
        var emailAlreadyExists = await dbContext.Users
            .AnyAsync(user => user.Email == normalizedEmail, cancellationToken);

        if (emailAlreadyExists)
        {
            return RegisterUserResult.Conflict("Já existe uma conta registrada com o e-mail informado.");
        }

        var user = new User
        {
            Id = Guid.NewGuid(),
            Name = request.Name.Trim(),
            Email = normalizedEmail,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
            Role = UserRole.User
        };

        dbContext.Users.Add(user);
        await dbContext.SaveChangesAsync(cancellationToken);

        return RegisterUserResult.Success();
    }

    public async Task<LoginUserResult> LoginAsync(LoginRequest request, CancellationToken cancellationToken)
    {
        // Valida os atributos de entrada do DTO antes de consultar o banco de dados.
        var validationErrors = ValidateRequest(request);
        if (validationErrors is not null)
        {
            return LoginUserResult.ValidationFailure(validationErrors);
        }

        var normalizedEmail = request.Email.Trim().ToLowerInvariant();
        var user = await dbContext.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(existingUser => existingUser.Email == normalizedEmail, cancellationToken);

        // Retorna mensagem genérica para evitar enumeração de e-mails cadastrados.
        if (user is null || !BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
        {
            return LoginUserResult.Unauthorized("E-mail ou senha inválidos.");
        }

        var response = new UserResponse(
            user.Id,
            user.Name,
            user.Email,
            user.Role.ToString().ToLowerInvariant());
        return LoginUserResult.Success(response);
    }

    public async Task<LogoutUserResult> LogoutAsync(Guid userId, CancellationToken cancellationToken)
    {
        // Localiza e revoga no banco todos os refresh tokens ativos vinculados ao usuário.
        var revokedTokensCount = await tokenManager.RevokeAsync(
            subject: userId.ToString(),
            client: null,
            status: Statuses.Valid,
            type: TokenTypeHints.RefreshToken,
            cancellationToken: cancellationToken);

        return LogoutUserResult.Success(revokedTokensCount);
    }

    private static Dictionary<string, string[]>? ValidateRequest<TRequest>(TRequest request)
        where TRequest : notnull
    {
        var validationResults = new List<ValidationResult>();
        var validationContext = new ValidationContext(request);

        if (Validator.TryValidateObject(request, validationContext, validationResults, validateAllProperties: true))
        {
            return null;
        }

        return validationResults
            .SelectMany(result => result.MemberNames.DefaultIfEmpty(string.Empty), (result, memberName) => new
            {
                MemberName = memberName,
                ErrorMessage = result.ErrorMessage ?? "O valor informado é inválido."
            })
            .GroupBy(error => error.MemberName)
            .ToDictionary(group => group.Key, group => group.Select(error => error.ErrorMessage).ToArray());
    }
}

