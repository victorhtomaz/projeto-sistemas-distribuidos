export function createSubmitButton(label) {
  const button = document.createElement('button');
  button.type = 'submit';
  button.dataset.js = 'submit-btn';
  button.className = [
    'inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold text-white',
    'bg-teal-700 shadow-xs transition hover:bg-teal-800',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2 dark:bg-teal-600 dark:hover:bg-teal-500 dark:focus-visible:ring-offset-surface-dark',
    'disabled:cursor-not-allowed disabled:opacity-50',
  ].join(' ');
  button.textContent = label;
  return button;
}

export function setButtonLoading(button, isLoading, loadingText, defaultText) {
  button.disabled = isLoading;
  button.replaceChildren();

  if (isLoading) {
    const spinner = document.createElement('span');
    spinner.className =
      'inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white';
    spinner.setAttribute('aria-hidden', 'true');

    const text = document.createElement('span');
    text.textContent = loadingText;
    button.append(spinner, text);
    return;
  }

  button.textContent = defaultText;
}
