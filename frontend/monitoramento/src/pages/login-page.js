import { createAlertBanner } from '../components/alert-banner.js';
import { createAuthShell } from '../components/auth-shell.js';
import { createFormField } from '../components/form-field.js';
import { createSubmitButton, setButtonLoading } from '../components/submit-button.js';
import { login } from '../services/auth-api.js';
import { isTrustedReturnUrl, startLoginRedirect } from '../services/oidc-service.js';
import { clearFieldErrors, getReturnUrlParam, setFieldError } from '../utils/dom.js';
import { ApiError } from '../utils/errors.js';
import { validateLogin } from '../utils/validators.js';

function applyLoginError({ error, alertSlot, emailField, passwordField }) {
  if (!(error instanceof ApiError)) {
    alertSlot.appendChild(
      createAlertBanner({
        variant: 'error',
        title: 'Serviço de autenticação indisponível.',
        detail: 'Ocorreu um erro inesperado ao autenticar.',
      })
    );
    return;
  }

  if (error.status === 400 && error.errors) {
    if (error.errors.email?.length) setFieldError(emailField.wrapper, error.errors.email[0]);
    if (error.errors.password?.length) setFieldError(passwordField.wrapper, error.errors.password[0]);
    if (!error.errors.email && !error.errors.password) {
      alertSlot.appendChild(
        createAlertBanner({
          variant: 'error',
          title: error.title || 'Erro ao validar requisição',
          detail: error.detail || 'Verifique os dados informados.',
        })
      );
    }
    return;
  }

  if (error.status === 401) {
    alertSlot.appendChild(
      createAlertBanner({
        variant: 'error',
        title: error.title || 'Credenciais inválidas.',
        detail: error.detail || 'E-mail ou senha inválidos.',
      })
    );
    return;
  }

  alertSlot.appendChild(
    createAlertBanner({
      variant: 'error',
      title: error.title || 'Serviço de autenticação indisponível.',
      detail: error.detail || 'Tente novamente em alguns instantes.',
    })
  );
}

export function renderLoginPage(container) {
  document.title = 'Entrar — Monitoramento';

  const params = new URLSearchParams(window.location.search);
  const returnUrl = getReturnUrlParam();

  const alertSlot = document.createElement('div');
  alertSlot.className = 'space-y-3 empty:hidden';

  if (params.get('registered') === '1') {
    alertSlot.appendChild(
      createAlertBanner({
        variant: 'success',
        title: 'Conta criada com sucesso!',
        detail: 'Agora informe seu e-mail e senha para entrar no sistema.',
      })
    );
  }

  if (params.get('error')) {
    alertSlot.appendChild(
      createAlertBanner({
        variant: 'error',
        title: 'Não foi possível concluir a autorização',
        detail: params.get('error_description') || params.get('error'),
      })
    );
  }

  const formEl = document.createElement('form');
  formEl.noValidate = true;
  formEl.className = 'space-y-4';

  const emailField = createFormField({
    id: 'login-email',
    name: 'email',
    label: 'E-mail',
    type: 'email',
    autocomplete: 'email',
    placeholder: 'nome@exemplo.com',
    required: true,
    maxLength: 256,
  });

  const passwordField = createFormField({
    id: 'login-password',
    name: 'password',
    label: 'Senha',
    type: 'password',
    autocomplete: 'current-password',
    placeholder: 'Digite sua senha',
    required: true,
    maxLength: 128,
  });

  const submitBtn = createSubmitButton('Entrar');
  formEl.append(emailField.wrapper, passwordField.wrapper, submitBtn);

  const footerEl = document.createElement('div');
  footerEl.className = 'border-t border-border-subtle pt-5 text-center text-sm dark:border-border-subtle-dark';

  const registerPrompt = document.createElement('p');
  registerPrompt.className = 'text-ink-muted dark:text-slate-400';
  registerPrompt.append('Ainda não tem uma conta? ');

  const registerLink = document.createElement('a');
  const registerSearch = returnUrl ? `?ReturnUrl=${encodeURIComponent(returnUrl)}` : '';
  registerLink.href = `/register${registerSearch}`;
  registerLink.dataset.js = 'nav-link';
  registerLink.className =
    'rounded font-semibold text-teal-700 transition hover:text-teal-800 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 dark:text-teal-400';
  registerLink.textContent = 'Criar conta';
  registerPrompt.appendChild(registerLink);

  footerEl.append(registerPrompt);

  formEl.addEventListener('submit', async (event) => {
    event.preventDefault();
    alertSlot.replaceChildren();
    clearFieldErrors(formEl);

    const email = emailField.input.value;
    const password = passwordField.input.value;

    const clientErrors = validateLogin({ email, password });
    if (Object.keys(clientErrors).length > 0) {
      if (clientErrors.email) setFieldError(emailField.wrapper, clientErrors.email);
      if (clientErrors.password) setFieldError(passwordField.wrapper, clientErrors.password);
      return;
    }

    setButtonLoading(submitBtn, true, 'Entrando...', 'Entrar');

    try {
      await login({ email: email.trim(), password });

      if (isTrustedReturnUrl(returnUrl)) {
        window.location.assign(returnUrl);
        return;
      }

      await startLoginRedirect();
    } catch (error) {
      applyLoginError({ error, alertSlot, emailField, passwordField });
      setButtonLoading(submitBtn, false, 'Entrando...', 'Entrar');
    }
  });

  const shell = createAuthShell({
    title: 'Acessar sistema',
    subtitle: 'Entre com seu e-mail e senha para continuar.',
    alertSlot,
    formEl,
    footerEl,
  });

  container.replaceChildren(shell);
}
