import { formatRemainingTime } from '../utils/format.js';

export function createSessionStatusCard({ onRefresh, onLogout }) {
  const card = document.createElement('section');
  card.className =
    'flex flex-col justify-between gap-5 rounded-2xl border border-border-subtle bg-surface p-5 shadow-xs sm:p-6 dark:border-border-subtle-dark dark:bg-surface-dark';

  const top = document.createElement('div');
  top.className = 'space-y-4';

  const headingRow = document.createElement('div');
  headingRow.className = 'flex items-center justify-between gap-2';

  const heading = document.createElement('h2');
  heading.className = 'text-base font-semibold text-ink dark:text-white';
  heading.textContent = 'Sessão ativa';

  const statusBadge = document.createElement('span');
  statusBadge.className =
    'inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300';
  statusBadge.innerHTML = '<span class="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>Conectado';

  headingRow.append(heading, statusBadge);

  const countdownBox = document.createElement('div');
  countdownBox.className =
    'rounded-xl border border-border-subtle bg-canvas p-4 dark:border-border-subtle-dark dark:bg-canvas-dark';

  const countdownLabel = document.createElement('p');
  countdownLabel.className = 'text-xs font-medium text-ink-muted dark:text-slate-400';
  countdownLabel.textContent = 'Tempo restante';

  const countdownValue = document.createElement('p');
  countdownValue.dataset.js = 'session-countdown';
  countdownValue.className = 'mt-1 text-2xl font-semibold tabular-nums text-teal-700 dark:text-teal-400';
  countdownValue.textContent = '--:--';

  countdownBox.append(countdownLabel, countdownValue);

  const metaList = document.createElement('dl');
  metaList.dataset.js = 'session-meta';
  metaList.className = 'space-y-2 text-xs';

  top.append(headingRow, countdownBox, metaList);

  const actions = document.createElement('div');
  actions.className = 'space-y-2.5';

  const refreshBtn = document.createElement('button');
  refreshBtn.type = 'button';
  refreshBtn.dataset.js = 'refresh-token-btn';
  refreshBtn.className =
    'inline-flex h-11 w-full items-center justify-center rounded-xl bg-teal-700 px-4 text-sm font-semibold text-white shadow-xs transition hover:bg-teal-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-teal-600 dark:hover:bg-teal-500';
  refreshBtn.textContent = 'Renovar sessão';
  refreshBtn.addEventListener('click', onRefresh);

  const logoutBtn = document.createElement('button');
  logoutBtn.type = 'button';
  logoutBtn.dataset.js = 'card-logout-btn';
  logoutBtn.className =
    'inline-flex h-11 w-full items-center justify-center rounded-xl border border-rose-200 bg-rose-50 px-4 text-sm font-semibold text-rose-700 transition hover:bg-rose-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 disabled:cursor-not-allowed disabled:opacity-50 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300 dark:hover:bg-rose-950/70';
  logoutBtn.textContent = 'Encerrar sessão';
  logoutBtn.addEventListener('click', onLogout);

  actions.append(refreshBtn, logoutBtn);
  card.append(top, actions);

  function updateCountdown(user) {
    countdownValue.textContent = formatRemainingTime(user?.expires_at);
  }

  function updateUser(user) {
    updateCountdown(user);
    if (!user) return;

    const item = document.createElement('div');
    item.className = 'flex items-center justify-between gap-2';

    const dt = document.createElement('dt');
    dt.className = 'text-ink-muted dark:text-slate-400';
    dt.textContent = 'Renovação automática';

    const dd = document.createElement('dd');
    dd.className = 'font-medium text-ink dark:text-slate-200';
    dd.textContent = user.refresh_token ? 'Ativa' : 'Indisponível';

    item.append(dt, dd);
    metaList.replaceChildren(item);
  }

  function setRefreshing(isRefreshing) {
    refreshBtn.disabled = isRefreshing;
    refreshBtn.textContent = isRefreshing ? 'Renovando…' : 'Renovar sessão';
  }

  function setLogoutDisabled(disabled) {
    logoutBtn.disabled = disabled;
  }

  return {
    element: card,
    updateUser,
    updateCountdown,
    setRefreshing,
    setLogoutDisabled,
  };
}
