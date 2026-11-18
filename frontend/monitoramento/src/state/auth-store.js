import { getCurrentUser, userManager } from '../services/oidc-service.js';

let currentUser = null;
let initialized = false;
const listeners = new Set();

function notify(user) {
  currentUser = user;
  for (const listener of listeners) {
    try {
      listener(currentUser);
    } catch {
      // Isola falhas de assinantes individuais.
    }
  }
}

export async function syncAuthStore() {
  try {
    const user = await getCurrentUser();
    notify(user);
    return user;
  } catch {
    notify(null);
    return null;
  }
}

export async function initAuthStore() {
  if (initialized) {
    return currentUser;
  }
  initialized = true;

  userManager.events.addUserLoaded((user) => {
    notify(user);
  });

  userManager.events.addUserUnloaded(() => {
    notify(null);
  });

  userManager.events.addSilentRenewError(() => {
    userManager.removeUser().catch(() => null);
    notify(null);
  });

  window.addEventListener('storage', (event) => {
    if (event.storageArea !== window.localStorage) {
      return;
    }
    if (event.key === null || event.key.startsWith('oidc.user:')) {
      syncAuthStore();
    }
  });

  return syncAuthStore();
}

export function getAuthState() {
  return currentUser;
}

export function isAuthenticated() {
  if (!currentUser) {
    return false;
  }
  return !currentUser.expired || Boolean(currentUser.refresh_token);
}

export function subscribeAuth(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
