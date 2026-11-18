import { setFieldError } from '../utils/dom.js';

const EYE_OPEN_SVG =
  '<svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" /><path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" /></svg>';

const EYE_CLOSED_SVG =
  '<svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" /></svg>';

export function createFormField({
  id,
  name,
  label,
  type = 'text',
  autocomplete = 'off',
  placeholder = '',
  required = false,
  minLength,
  maxLength,
  hint = '',
}) {
  const wrapper = document.createElement('div');
  wrapper.className = 'space-y-1.5';
  wrapper.dataset.js = 'field-group';
  wrapper.dataset.field = name;

  const labelEl = document.createElement('label');
  labelEl.htmlFor = id;
  labelEl.className = 'block text-sm font-medium text-ink dark:text-slate-200';
  labelEl.textContent = label;

  const inputContainer = document.createElement('div');
  inputContainer.className = 'relative';

  const isPassword = type === 'password';
  const input = document.createElement('input');
  input.id = id;
  input.name = name;
  input.type = type;
  input.autocomplete = autocomplete;
  input.placeholder = placeholder;
  input.dataset.js = 'field-input';
  if (required) input.required = true;
  if (typeof minLength === 'number') input.minLength = minLength;
  if (typeof maxLength === 'number') input.maxLength = maxLength;

  input.className = [
    'block h-11 w-full rounded-xl border bg-surface px-3.5 text-sm text-ink transition',
    'placeholder:text-slate-400 hover:border-slate-400',
    'border-border-input focus-visible:border-teal-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600/25',
    'disabled:cursor-not-allowed disabled:opacity-50',
    'dark:border-border-input-dark dark:bg-canvas-dark dark:text-slate-100 dark:placeholder:text-slate-500 dark:hover:border-slate-600 dark:focus-visible:border-teal-500',
    isPassword ? 'pr-11' : '',
  ]
    .filter(Boolean)
    .join(' ');

  inputContainer.appendChild(input);

  if (isPassword) {
    const toggleBtn = document.createElement('button');
    toggleBtn.type = 'button';
    toggleBtn.dataset.js = 'toggle-password';
    toggleBtn.className =
      'absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-r-xl text-ink-muted transition hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 disabled:cursor-not-allowed disabled:opacity-50 dark:text-slate-400 dark:hover:text-slate-200';
    toggleBtn.setAttribute('aria-label', 'Mostrar senha');
    toggleBtn.setAttribute('aria-pressed', 'false');
    toggleBtn.innerHTML = EYE_OPEN_SVG;

    toggleBtn.addEventListener('click', () => {
      const showing = input.type === 'text';
      input.type = showing ? 'password' : 'text';
      toggleBtn.setAttribute('aria-pressed', String(!showing));
      toggleBtn.setAttribute('aria-label', showing ? 'Mostrar senha' : 'Ocultar senha');
      toggleBtn.innerHTML = showing ? EYE_OPEN_SVG : EYE_CLOSED_SVG;
    });

    inputContainer.appendChild(toggleBtn);
  }

  const errorEl = document.createElement('p');
  errorEl.id = `${id}-error`;
  errorEl.dataset.js = 'field-error';
  errorEl.className = 'hidden text-xs font-medium text-rose-600 dark:text-rose-400';
  errorEl.setAttribute('aria-live', 'polite');

  wrapper.append(labelEl, inputContainer);

  if (hint) {
    const hintEl = document.createElement('p');
    hintEl.id = `${id}-hint`;
    hintEl.dataset.js = 'field-hint';
    hintEl.className = 'text-xs text-slate-500 dark:text-slate-400';
    hintEl.textContent = hint;
    input.setAttribute('aria-describedby', hintEl.id);
    wrapper.appendChild(hintEl);
  }

  wrapper.appendChild(errorEl);

  input.addEventListener('input', () => {
    setFieldError(wrapper, '');
  });

  return { wrapper, input, errorEl };
}
