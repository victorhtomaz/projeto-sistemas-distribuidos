const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateEmail(email) {
  const trimmed = email.trim();
  if (!trimmed) {
    return 'O e-mail é obrigatório.';
  }
  if (trimmed.length > 256) {
    return 'O e-mail deve ter no máximo 256 caracteres.';
  }
  if (!EMAIL_REGEX.test(trimmed)) {
    return 'O e-mail informado não é válido.';
  }
  return '';
}

export function validateLogin({ email, password }) {
  const errors = {};
  const emailError = validateEmail(email);
  if (emailError) {
    errors.email = emailError;
  }

  if (!password) {
    errors.password = 'A senha é obrigatória.';
  } else if (password.length > 128) {
    errors.password = 'A senha deve ter no máximo 128 caracteres.';
  }

  return errors;
}

export function validateRegister({ name, email, password, confirmPassword }) {
  const errors = {};
  const trimmedName = name.trim();

  if (!trimmedName) {
    errors.name = 'O nome é obrigatório.';
  } else if (trimmedName.length > 200) {
    errors.name = 'O nome deve ter entre 1 e 200 caracteres.';
  }

  const emailError = validateEmail(email);
  if (emailError) {
    errors.email = emailError;
  }

  if (!password) {
    errors.password = 'A senha é obrigatória.';
  } else if (password.length < 8 || password.length > 128) {
    errors.password = 'A senha deve ter entre 8 e 128 caracteres.';
  }

  if (!confirmPassword) {
    errors.confirmPassword = 'Confirme sua senha.';
  } else if (password !== confirmPassword) {
    errors.confirmPassword = 'As senhas informadas não coincidem.';
  }

  return errors;
}
