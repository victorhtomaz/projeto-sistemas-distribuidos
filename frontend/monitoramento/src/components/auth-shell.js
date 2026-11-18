import { createBrandMark } from './brand-mark.js';

export function createAuthShell({ title, subtitle, alertSlot, formEl, footerEl }) {
  const main = document.createElement('main');
  main.className = 'flex min-h-dvh flex-col items-center justify-center px-4 py-10 sm:px-6';

  const container = document.createElement('div');
  container.className = 'w-full max-w-md space-y-6';

  const brandWrap = document.createElement('div');
  brandWrap.className = 'flex justify-center';
  brandWrap.appendChild(createBrandMark());

  const card = document.createElement('section');
  card.className =
    'w-full space-y-6 rounded-2xl border border-border-subtle bg-surface p-6 shadow-xs sm:p-8 dark:border-border-subtle-dark dark:bg-surface-dark';

  const header = document.createElement('header');
  header.className = 'space-y-1.5 text-center sm:text-left';

  const h1 = document.createElement('h1');
  h1.className = 'text-xl font-semibold tracking-tight text-ink sm:text-2xl dark:text-white';
  h1.textContent = title;

  const p = document.createElement('p');
  p.className = 'text-sm text-ink-muted dark:text-slate-400';
  p.textContent = subtitle;

  header.append(h1, p);
  card.append(header);

  if (alertSlot) {
    card.appendChild(alertSlot);
  }

  card.appendChild(formEl);

  if (footerEl) {
    card.appendChild(footerEl);
  }

  container.append(brandWrap, card);
  main.appendChild(container);
  return main;
}
