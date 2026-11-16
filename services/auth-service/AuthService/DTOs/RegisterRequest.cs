using System.ComponentModel.DataAnnotations;

namespace AuthService.DTOs;

public sealed record RegisterRequest
{
    [Required(ErrorMessage = "O nome é obrigatório.")]
    [StringLength(200, MinimumLength = 1, ErrorMessage = "O nome deve ter entre 1 e 200 caracteres.")]
    public string Name { get; init; } = string.Empty;

    [Required(ErrorMessage = "O e-mail é obrigatório.")]
    [EmailAddress(ErrorMessage = "O e-mail informado não é válido.")]
    [StringLength(256, ErrorMessage = "O e-mail deve ter no máximo 256 caracteres.")]
    public string Email { get; init; } = string.Empty;

    [Required(ErrorMessage = "A senha é obrigatória.")]
    [StringLength(128, MinimumLength = 8, ErrorMessage = "A senha deve ter entre 8 e 128 caracteres.")]
    public string Password { get; init; } = string.Empty;
}
