using AuthService.DTOs;
using AuthService.Services;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;

namespace AuthService.Endpoints;

public static class AuthEndpoints
{
    public static void MapAuthEndpoints(this IEndpointRouteBuilder app)
    {
        var authGroup = app.MapGroup("/api/auth")
            .WithTags("Auth");

        authGroup.MapPost("/register", RegisterAsync)
            .WithName("Register")
            .Produces<UserResponse>(StatusCodes.Status201Created)
            .ProducesValidationProblem(StatusCodes.Status400BadRequest)
            .ProducesProblem(StatusCodes.Status409Conflict);
    }

    private static async Task<Results<Created<UserResponse>, ValidationProblem, Conflict<ProblemDetails>>>
        RegisterAsync(RegisterRequest request, IUserService userService, CancellationToken cancellationToken)
    {
        var result = await userService.RegisterAsync(request, cancellationToken);

        if (result.ValidationErrors is not null)
        {
            return TypedResults.ValidationProblem(result.ValidationErrors);
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

        return TypedResults.Created($"/api/auth/users/{result.User!.Id}", result.User);
    }
}
