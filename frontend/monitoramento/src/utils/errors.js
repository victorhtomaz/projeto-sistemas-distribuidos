export class ApiError extends Error {
  constructor({
    status = 0,
    title = 'Erro na requisição',
    detail = '',
    errors = null,
    oauthError = null,
    oauthErrorDescription = null,
  }) {
    super(detail || oauthErrorDescription || title);
    this.name = 'ApiError';
    this.status = status;
    this.title = title;
    this.detail = detail;
    this.errors = errors;
    this.oauthError = oauthError;
    this.oauthErrorDescription = oauthErrorDescription;
  }
}

function normalizeValidationErrors(rawErrors) {
  if (!rawErrors || typeof rawErrors !== 'object') {
    return null;
  }

  const normalized = {};
  for (const [key, messages] of Object.entries(rawErrors)) {
    const field = key.toLowerCase();
    normalized[field] = Array.isArray(messages) ? messages.map(String) : [String(messages)];
  }
  return normalized;
}

export async function parseApiErrorResponse(response) {
  let payload = null;
  const contentType = response.headers.get('content-type') || '';

  if (contentType.includes('json')) {
    try {
      payload = await response.json();
    } catch {
      payload = null;
    }
  }

  if (payload && typeof payload === 'object') {
    if (payload.error) {
      return new ApiError({
        status: response.status,
        title: 'Erro de autenticação OAuth 2.0',
        detail: payload.error_description || payload.error,
        oauthError: payload.error,
        oauthErrorDescription: payload.error_description || '',
      });
    }

    return new ApiError({
      status: response.status,
      title: payload.title || `Erro HTTP ${response.status}`,
      detail: payload.detail || '',
      errors: normalizeValidationErrors(payload.errors),
    });
  }

  if (response.status >= 500 || response.status === 0) {
    return new ApiError({
      status: response.status,
      title: 'Serviço de autenticação indisponível.',
      detail: 'Não foi possível processar sua solicitação no momento. Tente novamente em instantes.',
    });
  }

  return new ApiError({
    status: response.status,
    title: `Erro HTTP ${response.status}`,
    detail: response.statusText || 'Falha ao comunicar com o servidor.',
  });
}
