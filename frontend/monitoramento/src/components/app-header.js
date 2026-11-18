import { createBrandMark } from './brand-mark.js';

export function createAppHeader({ onLogout }) {
  const header = document.createElement('header');
  header.className =
    'sticky top-0 z-20 border-b border-border-subtle bg-surface/90 backdrop-blur-md dark:border-border-subtle-dark dark:bg-surface-dark/90';

  const inner = document.createElement('div');
  inner.className = 'mx-auto flex max-w-4xl items-center justify-between gap-4 px-4 py-3.5 sm:px-6';

  const brand = createBrandMark({ subtitle: 'Painel' });

  const actions = document.createElement('div');
  actions.className = 'flex items-center gap-3';

  const userBadge = document.createElement('div');
  userBadge.className = 'hidden text-right sm:block';

  const userNameEl = document.createElement('p');
  userNameEl.dataset.js = 'header-user-name';
  userNameEl.className = 'text-sm font-semibold text-ink dark:text-white';
  userNameEl.textContent = 'Carregando…';

  const userEmailEl = document.createElement('p');
  userEmailEl.dataset.js = 'header-user-email';
  userEmailEl.className = 'text-xs text-ink-muted dark:text-slate-400';

  userBadge.append(userNameEl, userEmailEl);

  const logoutBtn = document.createElement('button');
  logoutBtn.type = 'button';
  logoutBtn.dataset.js = 'header-logout-btn';
  logoutBtn.className =
    'inline-flex h-9 items-center justify-center rounded-xl border border-border-input bg-surface px-3.5 text-sm font-medium text-ink transition hover:bg-canvas focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 disabled:cursor-not-allowed disabled:opacity-50 dark:border-border-input-dark dark:bg-surface-dark dark:text-slate-200 dark:hover:bg-canvas-dark';
  logoutBtn.textContent = 'Sair';
  logoutBtn.addEventListener('click', onLogout);

  actions.append(userBadge, logoutBtn);
  inner.append(brand, actions);
  header.appendChild(inner);

  function setUser({ name, email }) {
    userNameEl.textContent = name || email || 'Usuário';
    userEmailEl.textContent = email || '';
  }

  function setLogoutDisabled(disabled) {
    logoutBtn.disabled = disabled;
  }

  return { element: header, setUser, setLogoutDisabled };
}
