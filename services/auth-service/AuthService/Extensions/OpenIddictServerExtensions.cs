using System.Security.Cryptography.X509Certificates;

namespace AuthService.Extensions;

public static class OpenIddictServerExtensions
{
    public static OpenIddictServerBuilder AddConfiguredCertificates(
        this OpenIddictServerBuilder builder,
        IConfiguration configuration,
        IHostEnvironment environment)
    {
        if (environment.IsDevelopment())
        {
            return builder.AddDevelopmentEncryptionCertificate()
                .AddDevelopmentSigningCertificate();
        }

        var certificatesSection = configuration.GetSection("OpenIddict:Certificates");

        var signingCertificate = LoadPkcs12Certificate(
            certificatesSection,
            pathKey: "SigningPath",
            passwordKey: "SigningPassword",
            certificateDescription: "assinatura");

        var encryptionCertificate = LoadPkcs12Certificate(
            certificatesSection,
            pathKey: "EncryptionPath",
            passwordKey: "EncryptionPassword",
            certificateDescription: "criptografia");

        return builder.AddSigningCertificate(signingCertificate)
            .AddEncryptionCertificate(encryptionCertificate);
    }

    private static X509Certificate2 LoadPkcs12Certificate(
        IConfigurationSection section,
        string pathKey,
        string passwordKey,
        string certificateDescription)
    {
        var path = section[pathKey];
        if (string.IsNullOrWhiteSpace(path))
        {
            throw new InvalidOperationException(
                $"O caminho do certificado de {certificateDescription} ('{section.Path}:{pathKey}') não está configurado.");
        }

        if (!File.Exists(path))
        {
            throw new FileNotFoundException(
                $"O arquivo do certificado de {certificateDescription} não foi encontrado em '{path}'.",
                path);
        }

        var password = section[passwordKey];

        // Usa EphemeralKeySet para evitar escrita no keystore local em containers Linux sem permissão.
        return X509CertificateLoader.LoadPkcs12FromFile(
            path,
            password,
            X509KeyStorageFlags.EphemeralKeySet);
    }
}

