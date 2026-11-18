import { createAlertBanner } from '../components/alert-banner.js';
import { completeLoginCallback, startLoginRedirect } from '../services/oidc-service.js';
import { syncAuthStore } from '../state/auth-store.js';

export function renderCallbackPage(container, { navigate }) {
  document.title = 'Validando login — Monitoramento';

  let cancelled = false;

  const wrapper = document.createElement('main');
  wrapper.className = 'flex min-h-dvh items-center justify-center px-4 py-8';

  const card = document.createElement('section');
  card.className =
    'w-full max-w-md space-y-5 rounded-2xl border border-border-subtle bg-surface p-6 text-center shadow-xs sm:p-8 dark:border-border-subtle-dark dark:bg-surface-dark';

  const spinnerBox = document.createElement('div');
  spinnerBox.className = 'flex flex-col items-center gap-4 py-4';
  spinnerBox.innerHTML =
    '<div class="h-10 w-10 animate-spin rounded-full border-4 border-teal-100 border-t-teal-700 dark:border-border-subtle-dark dark:border-t-teal-400" aria-hidden="true"></div>';

  const heading = document.createElement('h1');
  heading.className = 'text-lg font-semibold text-ink dark:text-white';
  heading.textContent = 'Concluindo login…';

  const subtext = document.createElement('p');
  subtext.className = 'text-sm text-ink-muted dark:text-slate-400';
  subtext.textContent = 'Validando seu acesso. Aguarde um instante.';

  spinnerBox.append(heading, subtext);
  card.appendChild(spinnerBox);
  wrapper.appendChild(card);
  container.replaceChildren(wrapper);

  function showError(title, detail) {
    if (cancelled) return;
    card.replaceChildren();

    const alert = createAlertBanner({ variant: 'error', title, detail });

    const actions = document.createElement('div');
    actions.className = 'flex flex-col gap-2.5 pt-2 sm:flex-row';

    const retryBtn = document.createElement('button');
    retryBtn.type = 'button';
    retryBtn.dataset.js = 'retry-oidc-btn';
    retryBtn.className =
      'inline-flex h-11 flex-1 items-center justify-center rounded-xl bg-teal-700 px-4 text-sm font-semibold text-white transition hover:bg-teal-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-teal-600 dark:hover:bg-teal-500';
    retryBtn.textContent = 'Tentar novamente';
    retryBtn.addEventListener('click', () => {
      startLoginRedirect();
    });

    const loginLink = document.createElement('a');
    loginLink.href = '/login';
    loginLink.dataset.js = 'nav-link';
    loginLink.className =
      'inline-flex h-11 flex-1 items-center justify-center rounded-xl border border-border-input bg-surface px-4 text-sm font-semibold text-ink transition hover:bg-canvas focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 dark:border-border-input-dark dark:bg-surface-dark dark:text-slate-200 dark:hover:bg-canvas-dark';
    loginLink.textContent = 'Voltar para o login';

    actions.append(retryBtn, loginLink);
    card.append(alert, actions);
  }

  async function processCallback() {
    const params = new URLSearchParams(window.location.search);
    const oauthError = params.get('error');
    const oauthErrorDescription = params.get('error_description');

    if (oauthError) {
      showError(
        'Autorização recusada',
        oauthErrorDescription || `O servidor retornou o erro "${oauthError}".`
      );
      return;
    }

    try {
      await completeLoginCallback();
      await syncAuthStore();
      if (!cancelled) {
        await navigate('/', { replace: true });
      }
    } catch (error) {
      const detail = error instanceof Error ? error.message : 'Não foi possível concluir a autenticação.';
      showError('Não foi possível concluir o acesso', detail);
    }
  }

  processCallback();

  return () => {
    cancelled = true;
  };
}
