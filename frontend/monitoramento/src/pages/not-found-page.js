export function renderNotFoundPage(container) {
  document.title = 'Página não encontrada — Monitoramento';

  const main = document.createElement('main');
  main.className = 'flex min-h-dvh items-center justify-center px-4 py-8';

  const card = document.createElement('section');
  card.className =
    'w-full max-w-md space-y-4 rounded-2xl border border-border-subtle bg-surface p-8 text-center shadow-xs dark:border-border-subtle-dark dark:bg-surface-dark';

  const code = document.createElement('p');
  code.className = 'text-sm font-semibold text-teal-700 dark:text-teal-400';
  code.textContent = '404';

  const title = document.createElement('h1');
  title.className = 'text-2xl font-bold text-ink dark:text-white';
  title.textContent = 'Página não encontrada';

  const desc = document.createElement('p');
  desc.className = 'text-sm text-ink-muted dark:text-slate-400';
  desc.textContent = 'A rota informada não existe neste aplicativo.';

  const link = document.createElement('a');
  link.href = '/';
  link.dataset.js = 'nav-link';
  link.className =
    'inline-flex h-11 items-center justify-center rounded-xl bg-teal-700 px-5 text-sm font-semibold text-white transition hover:bg-teal-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 dark:bg-teal-600 dark:hover:bg-teal-500';
  link.textContent = 'Ir para a página inicial';

  card.append(code, title, desc, link);
  main.appendChild(card);
  container.replaceChildren(main);
}
