export function setFieldError(fieldWrapper, message) {
  if (!fieldWrapper) return;
  const input = fieldWrapper.querySelector('[data-js="field-input"]');
  const errorEl = fieldWrapper.querySelector('[data-js="field-error"]');
  if (!input || !errorEl) return;

  if (message) {
    errorEl.textContent = message;
    errorEl.classList.remove('hidden');
    input.setAttribute('aria-invalid', 'true');
    input.setAttribute('aria-describedby', errorEl.id);
    input.classList.remove('border-border-input', 'dark:border-border-input-dark');
    input.classList.add('border-rose-500', 'dark:border-rose-500');
    return;
  }

  errorEl.textContent = '';
  errorEl.classList.add('hidden');
  input.removeAttribute('aria-invalid');
  const hint = fieldWrapper.querySelector('[data-js="field-hint"]');
  if (hint) {
    input.setAttribute('aria-describedby', hint.id);
  } else {
    input.removeAttribute('aria-describedby');
  }
  input.classList.remove('border-rose-500', 'dark:border-rose-500');
  input.classList.add('border-border-input', 'dark:border-border-input-dark');
}

export function clearFieldErrors(formEl) {
  formEl.querySelectorAll('[data-js="field-group"]').forEach((wrapper) => {
    setFieldError(wrapper, '');
  });
}

export function getReturnUrlParam() {
  const params = new URLSearchParams(window.location.search);
  return params.get('ReturnUrl') ?? params.get('returnUrl') ?? '';
}
