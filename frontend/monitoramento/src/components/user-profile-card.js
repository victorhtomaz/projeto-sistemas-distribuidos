function createClaimRow(label, value) {
  const row = document.createElement('div');
  row.className = 'flex flex-col gap-1 py-3.5 sm:flex-row sm:items-center sm:justify-between';

  const dt = document.createElement('dt');
  dt.className = 'text-sm text-ink-muted dark:text-slate-400';
  dt.textContent = label;

  const dd = document.createElement('dd');
  dd.className = 'break-all text-sm font-medium text-ink dark:text-slate-100';
  dd.textContent = value || '—';

  row.append(dt, dd);
  return row;
}

export function createUserProfileCard({ onReload }) {
  const card = document.createElement('section');
  card.className =
    'rounded-2xl border border-border-subtle bg-surface p-5 shadow-xs sm:p-6 lg:col-span-2 dark:border-border-subtle-dark dark:bg-surface-dark';

  const header = document.createElement('div');
  header.className =
    'flex flex-wrap items-center justify-between gap-3 border-b border-border-subtle pb-4 dark:border-border-subtle-dark';

  const title = document.createElement('h1');
  title.className = 'text-lg font-semibold text-ink dark:text-white';
  title.textContent = 'Dados da conta';

  const reloadBtn = document.createElement('button');
  reloadBtn.type = 'button';
  reloadBtn.dataset.js = 'reload-userinfo-btn';
  reloadBtn.className =
    'inline-flex h-9 items-center justify-center rounded-xl border border-border-input px-3.5 text-xs font-medium text-ink transition hover:bg-canvas focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 disabled:cursor-not-allowed disabled:opacity-50 dark:border-border-input-dark dark:text-slate-200 dark:hover:bg-canvas-dark';
  reloadBtn.textContent = 'Atualizar';
  reloadBtn.addEventListener('click', onReload);

  header.append(title, reloadBtn);

  const claimsList = document.createElement('dl');
  claimsList.dataset.js = 'claims-list';
  claimsList.className = 'divide-y divide-border-subtle pt-1 dark:divide-border-subtle-dark';

  card.append(header, claimsList);

  function setLoading() {
    reloadBtn.disabled = true;
    const loadingP = document.createElement('p');
    loadingP.className = 'py-4 text-sm text-ink-muted dark:text-slate-400';
    loadingP.textContent = 'Carregando informações da conta…';
    claimsList.replaceChildren(loadingP);
  }

  function setClaims(info) {
    reloadBtn.disabled = false;
    const rows = [
      ['Nome', info?.name],
      ['E-mail', info?.email],
      ['Perfil', info?.role],
      ['Identificador', info?.sub],
    ];

    const fragment = document.createDocumentFragment();
    for (const [label, value] of rows) {
      fragment.appendChild(createClaimRow(label, value));
    }
    claimsList.replaceChildren(fragment);
  }

  function setEmpty() {
    reloadBtn.disabled = false;
    const emptyP = document.createElement('p');
    emptyP.className = 'py-4 text-sm text-ink-muted dark:text-slate-400';
    emptyP.textContent = 'Nenhuma informação disponível no momento.';
    claimsList.replaceChildren(emptyP);
  }

  return { element: card, setLoading, setClaims, setEmpty };
}
