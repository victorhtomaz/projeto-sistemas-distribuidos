const VARIANT_STYLES = {
  error:
    'border-rose-200 bg-rose-50 text-rose-900 dark:border-rose-900/60 dark:bg-rose-950/50 dark:text-rose-100',
  success:
    'border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900/60 dark:bg-emerald-950/50 dark:text-emerald-100',
  info:
    'border-sky-200 bg-sky-50 text-sky-900 dark:border-sky-900/60 dark:bg-sky-950/50 dark:text-sky-100',
};

const ICON_COLORS = {
  error: 'text-rose-600 dark:text-rose-400',
  success: 'text-emerald-600 dark:text-emerald-400',
  info: 'text-sky-600 dark:text-sky-400',
};

const ICONS = {
  success:
    '<svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path fill-rule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm3.857-9.809a.75.75 0 0 0-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 1 0-1.06 1.061l2.5 2.5a.75.75 0 0 0 1.137-.089l4-5.5Z" clip-rule="evenodd" /></svg>',
  error:
    '<svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path fill-rule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16ZM8.28 7.22a.75.75 0 0 0-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 1 0 1.06 1.06L10 11.06l1.72 1.72a.75.75 0 1 0 1.06-1.06L11.06 10l1.72-1.72a.75.75 0 0 0-1.06-1.06L10 8.94 8.28 7.22Z" clip-rule="evenodd" /></svg>',
  info:
    '<svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path fill-rule="evenodd" d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-7-4a1 1 0 1 1-2 0 1 1 0 0 1 2 0ZM9 9a.75.75 0 0 0 0 1.5h.253a.25.25 0 0 1 .244.304l-.459 2.066A1.75 1.75 0 0 0 10.747 15H11a.75.75 0 0 0 0-1.5h-.253a.25.25 0 0 1-.244-.304l.459-2.066A1.75 1.75 0 0 0 9.253 9H9Z" clip-rule="evenodd" /></svg>',
};

export function createAlertBanner({ variant = 'info', title = '', detail = '' }) {
  const alert = document.createElement('div');
  alert.setAttribute('role', 'alert');
  alert.setAttribute('aria-live', variant === 'error' ? 'assertive' : 'polite');
  alert.className = `flex items-start gap-3 rounded-xl border px-4 py-3 text-sm text-left ${VARIANT_STYLES[variant] || VARIANT_STYLES.info}`;

  const iconWrap = document.createElement('span');
  iconWrap.className = `mt-0.5 shrink-0 ${ICON_COLORS[variant] || ICON_COLORS.info}`;
  iconWrap.innerHTML = ICONS[variant] || ICONS.info;

  const content = document.createElement('div');
  content.className = 'min-w-0 flex-1 space-y-0.5';

  if (title) {
    const titleEl = document.createElement('p');
    titleEl.className = 'font-semibold';
    titleEl.textContent = title;
    content.appendChild(titleEl);
  }

  if (detail) {
    const detailEl = document.createElement('p');
    detailEl.className = 'text-xs leading-relaxed opacity-90 sm:text-sm';
    detailEl.textContent = detail;
    content.appendChild(detailEl);
  }

  alert.append(iconWrap, content);
  return alert;
}
