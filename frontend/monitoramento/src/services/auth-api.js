import { ApiError, parseApiErrorResponse } from '../utils/errors.js';
import {
  getCurrentUser,
  refreshAccessToken,
  revokeAndRemoveUser,
} from './oidc-service.js';

const USERINFO_ENDPOINT = '/connect/userinfo';
const FRESHNESS_THRESHOLD_SEC = 30;

async function requestJson(url, options = {}) {
  let response;
  try {
    response = await fetch(url, {
      credentials: 'same-origin',
      ...options,
    });
  } catch {
    throw new ApiError({
      status: 0,
      title: 'Serviço de autenticação indisponível.',
      detail: 'Não foi possível conectar ao servidor de autenticação.',
    });
  }

  if (!response.ok) {
    throw await parseApiErrorResponse(response);
  }

  if (response.status === 204 || response.status === 201) {
    return null;
  }

  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('json')) {
    return response.json();
  }

  return null;
}

export async function login({ email, password }) {
  return requestJson('/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
}

export async function register({ name, email, password }) {
  return requestJson('/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password }),
  });
}

async function resolveValidAccessToken() {
  let user = await getCurrentUser();
  if (!user) {
    return null;
  }

  if (typeof user.expires_in === 'number' && user.expires_in <= FRESHNESS_THRESHOLD_SEC) {
    user = await refreshAccessToken();
  }

  return user?.access_token ?? null;
}

/**
 * Executa fetch autenticado com Bearer token e retry único após refresh em caso de 401.
 */
export async function authFetch(url, options = {}) {
  const token = await resolveValidAccessToken();
  if (!token) {
    throw new ApiError({
      status: 401,
      title: 'Sessão expirada',
      detail: 'Faça login novamente para continuar.',
    });
  }

  const headers = new Headers(options.headers || {});
  headers.set('Authorization', `Bearer ${token}`);

  let response;
  try {
    response = await fetch(url, {
      credentials: 'same-origin',
      ...options,
      headers,
    });
  } catch {
    throw new ApiError({
      status: 0,
      title: 'Serviço de autenticação indisponível.',
      detail: 'Falha de rede ao consultar o servidor.',
    });
  }

  if (response.status === 401) {
    const refreshedUser = await refreshAccessToken({ force: true });
    if (!refreshedUser?.access_token) {
      throw new ApiError({
        status: 401,
        title: 'Sessão expirada',
        detail: 'Faça login novamente para continuar.',
      });
    }

    const retryHeaders = new Headers(options.headers || {});
    retryHeaders.set('Authorization', `Bearer ${refreshedUser.access_token}`);

    response = await fetch(url, {
      credentials: 'same-origin',
      ...options,
      headers: retryHeaders,
    });
  }

  return response;
}

export async function getUserInfo() {
  const response = await authFetch(USERINFO_ENDPOINT, { method: 'GET' });

  if (!response.ok) {
    throw await parseApiErrorResponse(response);
  }

  return response.json();
}

export async function logout() {
  const user = await getCurrentUser();

  try {
    await revokeAndRemoveUser();

    const headers = {};
    if (user?.access_token) {
      headers.Authorization = `Bearer ${user.access_token}`;
    }

    await fetch('/auth/logout', {
      method: 'POST',
      headers,
      credentials: 'same-origin',
    });
  } catch {
    // O estado local já foi removido pelo revokeAndRemoveUser().
  }
}
