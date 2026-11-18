import { createAlertBanner } from '../components/alert-banner.js';
import { createAuthShell } from '../components/auth-shell.js';
import { createFormField } from '../components/form-field.js';
import { createSubmitButton, setButtonLoading } from '../components/submit-button.js';
import { register } from '../services/auth-api.js';
import { clearFieldErrors, getReturnUrlParam, setFieldError } from '../utils/dom.js';
import { ApiError } from '../utils/errors.js';
import { validateRegister } from '../utils/validators.js';

function applyRegisterError({ error, alertSlot, nameField, emailField, passwordField }) {
  if (!(error instanceof ApiError)) {
    alertSlot.appendChild(
      createAlertBanner({
        variant: 'error',
        title: 'Serviço de autenticação indisponível.',
        detail: 'Ocorreu um erro inesperado ao criar a conta.',
      })
    );
    return;
  }

  if (error.status === 400 && error.errors) {
    if (error.errors.name?.length) setFieldError(nameField.wrapper, error.errors.name[0]);
    if (error.errors.email?.length) setFieldError(emailField.wrapper, error.errors.email[0]);
    if (error.errors.password?.length) setFieldError(passwordField.wrapper, error.errors.password[0]);
    if (!error.errors.name && !error.errors.email && !error.errors.password) {
      alertSlot.appendChild(
        createAlertBanner({
          variant: 'error',
          title: error.title || 'Erro ao validar requisição',
          detail: error.detail || 'Verifique os campos informados.',
        })
      );
    }
    return;
  }

  if (error.status === 409) {
    setFieldError(emailField.wrapper, 'Este e-mail já está em uso.');
    alertSlot.appendChild(
      createAlertBanner({
        variant: 'error',
        title: error.title || 'E-mail já cadastrado.',
        detail: error.detail || 'Já existe uma conta registrada com o e-mail informado.',
      })
    );
    return;
  }

  alertSlot.appendChild(
    createAlertBanner({
      variant: 'error',
      title: error.title || 'Serviço de autenticação indisponível.',
      detail: error.detail || 'Não foi possível concluir o cadastro.',
    })
  );
}

export function renderRegisterPage(container, { navigate }) {
  document.title = 'Criar conta — Monitoramento';

  const returnUrl = getReturnUrlParam();
  const alertSlot = document.createElement('div');
  alertSlot.className = 'space-y-3 empty:hidden';

  const formEl = document.createElement('form');
  formEl.noValidate = true;
  formEl.className = 'space-y-4';

  const nameField = createFormField({
    id: 'register-name',
    name: 'name',
    label: 'Nome completo',
    type: 'text',
    autocomplete: 'name',
    placeholder: 'Seu nome',
    required: true,
    minLength: 1,
    maxLength: 200,
  });

  const emailField = createFormField({
    id: 'register-email',
    name: 'email',
    label: 'E-mail',
    type: 'email',
    autocomplete: 'email',
    placeholder: 'nome@exemplo.com',
    required: true,
    maxLength: 256,
  });

  const passwordField = createFormField({
    id: 'register-password',
    name: 'password',
    label: 'Senha',
    type: 'password',
    autocomplete: 'new-password',
    placeholder: 'Mínimo de 8 caracteres',
    required: true,
    minLength: 8,
    maxLength: 128,
    hint: 'Use entre 8 e 128 caracteres.',
  });

  const confirmField = createFormField({
    id: 'register-confirm-password',
    name: 'confirmPassword',
    label: 'Confirmar senha',
    type: 'password',
    autocomplete: 'new-password',
    placeholder: 'Repita a senha',
    required: true,
    minLength: 8,
    maxLength: 128,
  });

  const submitBtn = createSubmitButton('Criar conta');
  formEl.append(
    nameField.wrapper,
    emailField.wrapper,
    passwordField.wrapper,
    confirmField.wrapper,
    submitBtn
  );

  const footerEl = document.createElement('div');
  footerEl.className = 'border-t border-border-subtle pt-5 text-center text-sm dark:border-border-subtle-dark';

  const loginPrompt = document.createElement('p');
  loginPrompt.className = 'text-ink-muted dark:text-slate-400';
  loginPrompt.append('Já possui uma conta? ');

  const loginLink = document.createElement('a');
  const loginSearch = returnUrl ? `?ReturnUrl=${encodeURIComponent(returnUrl)}` : '';
  loginLink.href = `/login${loginSearch}`;
  loginLink.dataset.js = 'nav-link';
  loginLink.className =
    'rounded font-semibold text-teal-700 transition hover:text-teal-800 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 dark:text-teal-400';
  loginLink.textContent = 'Voltar para o login';
  loginPrompt.appendChild(loginLink);
  footerEl.appendChild(loginPrompt);

  formEl.addEventListener('submit', async (event) => {
    event.preventDefault();
    alertSlot.replaceChildren();
    clearFieldErrors(formEl);

    const payload = {
      name: nameField.input.value,
      email: emailField.input.value,
      password: passwordField.input.value,
      confirmPassword: confirmField.input.value,
    };

    const clientErrors = validateRegister(payload);
    if (Object.keys(clientErrors).length > 0) {
      if (clientErrors.name) setFieldError(nameField.wrapper, clientErrors.name);
      if (clientErrors.email) setFieldError(emailField.wrapper, clientErrors.email);
      if (clientErrors.password) setFieldError(passwordField.wrapper, clientErrors.password);
      if (clientErrors.confirmPassword) setFieldError(confirmField.wrapper, clientErrors.confirmPassword);
      return;
    }

    setButtonLoading(submitBtn, true, 'Criando conta...', 'Criar conta');

    try {
      await register({
        name: payload.name.trim(),
        email: payload.email.trim(),
        password: payload.password,
      });

      const nextParams = new URLSearchParams({ registered: '1' });
      if (returnUrl) {
        nextParams.set('ReturnUrl', returnUrl);
      }
      navigate(`/login?${nextParams.toString()}`);
    } catch (error) {
      applyRegisterError({ error, alertSlot, nameField, emailField, passwordField });
      setButtonLoading(submitBtn, false, 'Criando conta...', 'Criar conta');
    }
  });

  const shell = createAuthShell({
    title: 'Criar nova conta',
    subtitle: 'Cadastre seus dados para acessar o painel de monitoramento.',
    alertSlot,
    formEl,
    footerEl,
  });

  container.replaceChildren(shell);
}
