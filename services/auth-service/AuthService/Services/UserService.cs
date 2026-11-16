using System.ComponentModel.DataAnnotations;
using AuthService.Data;
using AuthService.DTOs;
using AuthService.Models;
using Microsoft.EntityFrameworkCore;

namespace AuthService.Services;

public sealed class UserService(ApplicationDbContext dbContext) : IUserService
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
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password)
        };

        dbContext.Users.Add(user);
        await dbContext.SaveChangesAsync(cancellationToken);

        var response = new UserResponse(user.Id, user.Name, user.Email);
        return RegisterUserResult.Success(response);
    }

    private static Dictionary<string, string[]>? ValidateRequest(RegisterRequest request)
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

