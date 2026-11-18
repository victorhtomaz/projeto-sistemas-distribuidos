import { createAlertBanner } from '../components/alert-banner.js';
import { renderCallbackPage } from '../pages/callback-page.js';
import { renderHomePage } from '../pages/home-page.js';
import { renderLoginPage } from '../pages/login-page.js';
import { renderNotFoundPage } from '../pages/not-found-page.js';
import { renderRegisterPage } from '../pages/register-page.js';
import { startLoginRedirect } from '../services/oidc-service.js';
import { isAuthenticated, subscribeAuth } from '../state/auth-store.js';
import { getReturnUrlParam } from './dom.js';

let appContainer = null;
let currentCleanup = null;

async function renderRedirectingToAuthorize(container) {
  document.title = 'Autenticando — Monitoramento';

  const main = document.createElement('main');
  main.className = 'flex min-h-dvh items-center justify-center px-4 py-8';

  const card = document.createElement('section');
  card.className =
    'w-full max-w-md space-y-4 rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-lg dark:border-slate-800 dark:bg-slate-900';

  card.innerHTML = `
    <div class="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-indigo-100 border-t-indigo-600 dark:border-slate-800 dark:border-t-indigo-400" aria-hidden="true"></div>
    <h1 class="text-lg font-semibold text-slate-900 dark:text-white">Iniciando autenticação…</h1>
    <p class="text-sm text-slate-600 dark:text-slate-400">Redirecionando para o provedor OpenID Connect.</p>
  `;

  main.appendChild(card);
  container.replaceChildren(main);

  try {
    await startLoginRedirect();
  } catch {
    card.replaceChildren(
      createAlertBanner({
        variant: 'error',
        title: 'Erro ao iniciar autorização',
        detail: 'Não foi possível conectar ao provedor OpenID Connect.',
      })
    );
  }
}

async function renderRoute() {
  if (!appContainer) return;

  if (typeof currentCleanup === 'function') {
    currentCleanup();
    currentCleanup = null;
  }

  const pathname = window.location.pathname;
  const routeHelpers = { navigate };

  if (pathname === '/') {
    if (!isAuthenticated()) {
      await renderRedirectingToAuthorize(appContainer);
      return;
    }
    currentCleanup = renderHomePage(appContainer, routeHelpers) || null;
    return;
  }

  if (pathname === '/login') {
    if (isAuthenticated() && !getReturnUrlParam()) {
      await navigate('/', { replace: true });
      return;
    }
    currentCleanup = renderLoginPage(appContainer, routeHelpers) || null;
    return;
  }

  if (pathname === '/register') {
    if (isAuthenticated() && !getReturnUrlParam()) {
      await navigate('/', { replace: true });
      return;
    }
    currentCleanup = renderRegisterPage(appContainer, routeHelpers) || null;
    return;
  }

  if (pathname === '/callback') {
    currentCleanup = renderCallbackPage(appContainer, routeHelpers) || null;
    return;
  }

  renderNotFoundPage(appContainer);
}

export async function navigate(to, { replace = false } = {}) {
  const targetUrl = new URL(to, window.location.origin);
  const nextHref = targetUrl.pathname + targetUrl.search + targetUrl.hash;
  const currentHref = window.location.pathname + window.location.search + window.location.hash;

  if (nextHref !== currentHref) {
    if (replace) {
      window.history.replaceState(null, '', nextHref);
    } else {
      window.history.pushState(null, '', nextHref);
    }
  }

  await renderRoute();
}

export async function initRouter(container) {
  appContainer = container;

  document.addEventListener('click', (event) => {
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return;
    }

    const link = event.target.closest('a[data-js="nav-link"]');
    if (!link) return;

    const href = link.getAttribute('href');
    if (!href) return;

    event.preventDefault();
    navigate(href);
  });

  window.addEventListener('popstate', () => {
    renderRoute();
  });

  subscribeAuth((user) => {
    const pathname = window.location.pathname;
    if (!user && pathname === '/') {
      navigate('/login', { replace: true });
    } else if (user && (pathname === '/login' || pathname === '/register') && !getReturnUrlParam()) {
      navigate('/', { replace: true });
    }
  });

  await renderRoute();
}
