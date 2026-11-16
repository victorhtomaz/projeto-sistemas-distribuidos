using AuthService.Data;
using AuthService.Endpoints;
using AuthService.Extensions;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.WebUtilities;
using Microsoft.EntityFrameworkCore;
using OpenIddict.Validation.AspNetCore;
using Scalar.AspNetCore;
using static OpenIddict.Abstractions.OpenIddictConstants;

var builder = WebApplication.CreateBuilder(args);

var connectionString = builder.Configuration.GetConnectionString("DefaultConnection")
    ?? throw new InvalidOperationException("The DefaultConnection connection string is not configured.");

var loginUrl = builder.Configuration["Authentication:LoginUrl"] ?? "/api/auth/login";

builder.Services.AddDbContext<ApplicationDbContext>(options =>
{
    options.UseNpgsql(connectionString);
    options.UseOpenIddict();
});

builder.Services.AddOpenIddict()
    .AddCore(options =>
    {
        options.UseEntityFrameworkCore()
            .UseDbContext<ApplicationDbContext>();
    })
    .AddServer(options =>
    {
        options.SetAuthorizationEndpointUris("/connect/authorize");
        options.SetTokenEndpointUris("/connect/token");
        options.AllowAuthorizationCodeFlow()
            .RequireProofKeyForCodeExchange();
        options.SetJsonWebKeySetEndpointUris("/.well-known/jwks");
        options.AllowRefreshTokenFlow();
        options.AllowClientCredentialsFlow();
        options.RegisterScopes(Scopes.OpenId, Scopes.Email, Scopes.Profile, Scopes.OfflineAccess);
        options.AddDevelopmentEncryptionCertificate()
            .AddDevelopmentSigningCertificate();
        var aspNetCoreBuilder = options.UseAspNetCore()
            .EnableAuthorizationEndpointPassthrough()
            .EnableTokenEndpointPassthrough();

        if (builder.Environment.IsDevelopment())
        {
            aspNetCoreBuilder.DisableTransportSecurityRequirement();
        }
    })
    .AddValidation(options =>
    {
        options.UseLocalServer();
        options.UseAspNetCore();
    });

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = OpenIddictValidationAspNetCoreDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = OpenIddictValidationAspNetCoreDefaults.AuthenticationScheme;
})
.AddCookie(CookieAuthenticationDefaults.AuthenticationScheme, options =>
{
    // Define o cookie de sessão temporário e enxuto para o fluxo de autorização OAuth/OIDC.
    options.Cookie.Name = ".AuthService.Session";
    options.Cookie.HttpOnly = true;
    options.Cookie.SameSite = SameSiteMode.Lax;
    options.Cookie.SecurePolicy = builder.Environment.IsDevelopment()
        ? CookieSecurePolicy.SameAsRequest
        : CookieSecurePolicy.Always;
    options.ExpireTimeSpan = TimeSpan.FromMinutes(15);
    options.SlidingExpiration = false;
    options.Events.OnRedirectToLogin = context =>
    {
        // Redireciona para a URL de login configurada (relativa ou absoluta) preservando o ReturnUrl.
        var returnUrl = context.Properties.RedirectUri;
        var targetUrl = !string.IsNullOrWhiteSpace(returnUrl)
            ? QueryHelpers.AddQueryString(loginUrl, context.Options.ReturnUrlParameter, returnUrl)
            : loginUrl;

        context.Response.Redirect(targetUrl);
        return Task.CompletedTask;
    };
});

builder.Services.AddAuthorization();
builder.Services.AddOpenApi();
builder.Services.AddApplicationServices();

var app = builder.Build();

app.UseExceptionHandler();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.MapScalarApiReference();
}

app.UseHttpsRedirection();
app.UseAuthentication();
app.UseAuthorization();

app.MapGet("/", () => "Em funcionamento");
app.MapAuthEndpoints();
app.MapConnectEndpoints();

app.Run();