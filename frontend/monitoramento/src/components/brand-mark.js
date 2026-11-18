export function createBrandMark({ subtitle = '' } = {}) {
  const wrapper = document.createElement('div');
  wrapper.className = 'inline-flex items-center gap-3';

  wrapper.innerHTML = `
    <span class="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-teal-700 text-white shadow-xs dark:bg-teal-600">
      <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
        <path stroke-linecap="round" stroke-linejoin="round" d="M3 13h4l3-8 4 14 3-6h4" />
      </svg>
    </span>
    <div class="leading-tight">
      <span class="block text-base font-semibold tracking-tight text-ink dark:text-white">Monitoramento</span>
      <span class="hidden text-xs text-ink-muted dark:text-slate-400" data-js="brand-subtitle"></span>
    </div>
  `;

  const subtitleEl = wrapper.querySelector('[data-js="brand-subtitle"]');
  if (subtitle) {
    subtitleEl.textContent = subtitle;
    subtitleEl.classList.remove('hidden');
    subtitleEl.classList.add('block');
  }

  return wrapper;
}
