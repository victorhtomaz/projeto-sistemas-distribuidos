using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Mvc;

namespace AuthService.Extensions;

public sealed class GlobalExceptionHandler(
    IProblemDetailsService problemDetailsService,
    ILogger<GlobalExceptionHandler> logger,
    IHostEnvironment environment) : IExceptionHandler
{
    public async ValueTask<bool> TryHandleAsync(
        HttpContext httpContext,
        Exception exception,
        CancellationToken cancellationToken)
    {
        var statusCode = exception is BadHttpRequestException badHttpRequestException
            ? badHttpRequestException.StatusCode
            : StatusCodes.Status500InternalServerError;

        var title = statusCode == StatusCodes.Status500InternalServerError
            ? "Erro interno do servidor."
            : "Requisição inválida.";

        logger.LogError(
            exception,
            "Exceção não tratada ao processar a requisição {Method} {Path}.",
            httpContext.Request.Method,
            httpContext.Request.Path);

        var problemDetails = new ProblemDetails
        {
            Status = statusCode,
            Title = title,
            Detail = environment.IsDevelopment() || statusCode != StatusCodes.Status500InternalServerError
                ? exception.Message
                : "Ocorreu um erro inesperado ao processar a requisição.",
            Instance = httpContext.Request.Path
        };

        httpContext.Response.StatusCode = statusCode;

        // Delega a escrita padronizada de ProblemDetails (incluindo traceId) ao serviço nativo.
        return await problemDetailsService.TryWriteAsync(new ProblemDetailsContext
        {
            HttpContext = httpContext,
            Exception = exception,
            ProblemDetails = problemDetails
        });
    }
}

