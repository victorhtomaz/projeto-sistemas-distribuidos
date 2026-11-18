/**
 * Formata o tempo restante até a expiração (em segundos Unix) para exibição MM:SS ou HH:MM:SS.
 */
export function formatRemainingTime(expiresAtSec) {
  if (typeof expiresAtSec !== 'number' || Number.isNaN(expiresAtSec)) {
    return '--:--';
  }

  const diffSec = Math.max(0, Math.floor(expiresAtSec - Date.now() / 1000));
  const hours = Math.floor(diffSec / 3600);
  const minutes = Math.floor((diffSec % 3600) / 60);
  const seconds = diffSec % 60;

  if (hours > 0) {
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }

  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

/**
 * Decodifica o payload de um JWT apenas para exibição de metadados na UI (não valida assinatura).
 */
export function decodeJwtPayload(token) {
  if (!token || typeof token !== 'string') {
    return null;
  }

  const parts = token.split('.');
  if (parts.length < 2) {
    return null;
  }

  try {
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
    const bytes = Uint8Array.from(atob(padded), (ch) => ch.charCodeAt(0));
    const json = new TextDecoder().decode(bytes);
    return JSON.parse(json);
  } catch {
    return null;
  }
}
