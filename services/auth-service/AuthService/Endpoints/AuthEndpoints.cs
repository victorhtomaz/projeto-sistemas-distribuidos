using System.Security.Claims;
using AuthService.DTOs;
using AuthService.Services;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;

namespace AuthService.Endpoints;

public static class AuthEndpoints
{
    public static void MapAuthEndpoints(this IEndpointRouteBuilder app)
    {
        var authGroup = app.MapGroup("/auth")
            .WithTags("Auth");

        authGroup.MapPost("/register", RegisterAsync)
            .WithName("Register")
            .Produces(StatusCodes.Status201Created)
            .ProducesValidationProblem(StatusCodes.Status400BadRequest)
            .ProducesProblem(StatusCodes.Status409Conflict);

        authGroup.MapPost("/login", LoginAsync)
            .WithName("Login")
            .Produces<UserResponse>(StatusCodes.Status200OK)
            .ProducesValidationProblem(StatusCodes.Status400BadRequest)
            .ProducesProblem(StatusCodes.Status401Unauthorized);
    }

    private static async Task<Results<Created, ValidationProblem, Conflict<ProblemDetails>>>
        RegisterAsync(RegisterRequest request, IUserService userService, CancellationToken cancellationToken)
    {
        var result = await userService.RegisterAsync(request, cancellationToken);

        if (result.ValidationErrors is not null)
        {
            return TypedResults.ValidationProblem(title: "Erro ao validar requisição" , errors: result.ValidationErrors);
        }

        if (result.IsConflict)
        {
            return TypedResults.Conflict(new ProblemDetails
            {
                Title = "E-mail já cadastrado.",
                Detail = result.ErrorMessage,
                Status = StatusCodes.Status409Conflict
            });
        }

        return TypedResults.Created(string.Empty);
    }

    private static async Task<Results<Ok<UserResponse>, ValidationProblem, ProblemHttpResult>>
        LoginAsync(
            LoginRequest request,
            IUserService userService,
            HttpContext httpContext,
            CancellationToken cancellationToken)
    {
        var result = await userService.LoginAsync(request, cancellationToken);

        if (result.ValidationErrors is not null)
        {
            return TypedResults.ValidationProblem(title: "Erro ao validar requisição", errors: result.ValidationErrors);
        }

        if (result.IsUnauthorized)
        {
            return TypedResults.Problem(
                title: "Credenciais inválidas.",
                detail: result.ErrorMessage,
                statusCode: StatusCodes.Status401Unauthorized);
        }

        var user = result.User!;

        // Cria o bilhete de identidade (ClaimsPrincipal) para emissão do cookie de sessão.
        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new(ClaimTypes.Name, user.Name),
            new(ClaimTypes.Email, user.Email)
        };

        var identity = new ClaimsIdentity(claims, CookieAuthenticationDefaults.AuthenticationScheme);
        var principal = new ClaimsPrincipal(identity);

        await httpContext.SignInAsync(CookieAuthenticationDefaults.AuthenticationScheme, principal);

        return TypedResults.Ok(user);
    }
}
