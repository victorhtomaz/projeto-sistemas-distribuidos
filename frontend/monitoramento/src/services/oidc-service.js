import { UserManager, WebStorageStateStore } from 'oidc-client-ts';

const CLIENT_ID = 'web-client';
const OIDC_SCOPE = 'openid email profile offline_access';
const AUTHORIZE_PATH = '/connect/authorize';
const REFRESH_LOCK_NAME = 'monitoramento.auth.refresh';
const CROSS_TAB_FRESH_SEC = 45;

let inFlightRefresh = null;

function getRedirectUri() {
  return `${window.location.origin}/callback`;
}

const origin = window.location.origin;

export const userManager = new UserManager({
  authority: origin,
  client_id: CLIENT_ID,
  redirect_uri: getRedirectUri(),
  response_type: 'code',
  scope: OIDC_SCOPE,
  metadataSeed: {
    authorization_endpoint: `${origin}/connect/authorize`,
    token_endpoint: `${origin}/connect/token`,
    userinfo_endpoint: `${origin}/connect/userinfo`,
    revocation_endpoint: `${origin}/connect/revoke`,
    jwks_uri: `${origin}/.well-known/jwks`,
  },
  userStore: new WebStorageStateStore({ store: window.localStorage }),
  stateStore: new WebStorageStateStore({ store: window.sessionStorage }),
  automaticSilentRenew: true,
  loadUserInfo: true,
  monitorSession: false,
});

export function startLoginRedirect() {
  return userManager.signinRedirect();
}

export function completeLoginCallback() {
  return userManager.signinCallback();
}

export function getCurrentUser() {
  return userManager.getUser();
}

/**
 * Valida se ReturnUrl aponta para /connect/authorize na mesma origem e corresponde
 * a um estado PKCE pendente da oidc-client-ts no sessionStorage desta aba.
 */
export function isTrustedReturnUrl(returnUrl) {
  if (typeof returnUrl !== 'string' || !returnUrl.startsWith(AUTHORIZE_PATH) || returnUrl.startsWith('//')) {
    return false;
  }

  let parsed;
  try {
    parsed = new URL(returnUrl, window.location.origin);
  } catch {
    return false;
  }

  if (parsed.origin !== window.location.origin || parsed.pathname !== AUTHORIZE_PATH) {
    return false;
  }

  const params = parsed.searchParams;
  if (
    params.get('client_id') !== CLIENT_ID ||
    params.get('redirect_uri') !== getRedirectUri() ||
    params.get('response_type') !== 'code'
  ) {
    return false;
  }

  const state = params.get('state');
  return Boolean(state && window.sessionStorage.getItem(`oidc.${state}`));
}

async function withCrossTabLock(fn) {
  if (typeof navigator !== 'undefined' && navigator.locks?.request) {
    return navigator.locks.request(REFRESH_LOCK_NAME, fn);
  }
  return fn();
}

/**
 * Renova o access_token via refresh_token usando oidc-client-ts,
 * serializado dentro da aba (inFlightRefresh) e entre abas (Web Locks API).
 */
export async function refreshAccessToken({ force = false } = {}) {
  if (!inFlightRefresh) {
    inFlightRefresh = withCrossTabLock(async () => {
      const currentUser = await userManager.getUser();
      if (!currentUser?.refresh_token) {
        await userManager.removeUser();
        return null;
      }

      if (!force && typeof currentUser.expires_in === 'number' && currentUser.expires_in > CROSS_TAB_FRESH_SEC) {
        return currentUser;
      }

      try {
        return await userManager.signinSilent();
      } catch (error) {
        await userManager.removeUser();
        throw error;
      }
    }).finally(() => {
      inFlightRefresh = null;
    });
  }

  return inFlightRefresh;
}

export async function revokeAndRemoveUser() {
  try {
    await userManager.revokeTokens(['refresh_token']);
  } catch {
    // Segue para remoção local mesmo se o servidor já tiver invalidado o token.
  } finally {
    await userManager.removeUser();
  }
}
