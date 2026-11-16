using System.ComponentModel.DataAnnotations;

namespace AuthService.DTOs;

public sealed record LoginRequest
{
    [Required(ErrorMessage = "O e-mail é obrigatório.")]
    [EmailAddress(ErrorMessage = "O e-mail informado não é válido.")]
    [StringLength(256, ErrorMessage = "O e-mail deve ter no máximo 256 caracteres.")]
    public string Email { get; init; } = string.Empty;

    [Required(ErrorMessage = "A senha é obrigatória.")]
    [StringLength(128, ErrorMessage = "A senha deve ter no máximo 128 caracteres.")]
    public string Password { get; init; } = string.Empty;
}

