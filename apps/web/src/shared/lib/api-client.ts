import {
  type ApiErrorCode,
  type ApiSuccessResponse,
  type AuthSession,
  type FieldError,
} from '@calce/types';
import { env } from '@/shared/config/env';
import { tokenStorage } from './token-storage';

/** Error normalizado de la API. El codigo es lo que mira la UI, no el mensaje. */
export class ApiClientError extends Error {
  constructor(
    readonly code: ApiErrorCode,
    message: string,
    readonly statusCode: number,
    readonly fields: FieldError[] = [],
  ) {
    super(message);
    this.name = 'ApiClientError';
  }
}

export type QueryParams = Record<string, string | number | boolean | undefined | null>;

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  body?: unknown;
  params?: QueryParams;
  /** Rutas publicas: no adjunta token ni intenta refrescar. */
  anonymous?: boolean;
}

type UnauthenticatedListener = () => void;

const listeners = new Set<UnauthenticatedListener>();

/**
 * Notifica que la sesion se perdio de forma irrecuperable.
 *
 * La capa de routing se suscribe para mandar al login. El cliente HTTP no
 * navega por su cuenta: no conoce el router.
 */
export function onUnauthenticated(listener: UnauthenticatedListener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function notifyUnauthenticated(): void {
  tokenStorage.clear();
  for (const listener of listeners) {
    listener();
  }
}

function buildUrl(path: string, params?: QueryParams): string {
  const url = new URL(`${env.VITE_API_URL.replace(/\/$/, '')}${path}`);

  for (const [key, value] of Object.entries(params ?? {})) {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.set(key, String(value));
    }
  }

  return url.toString();
}

interface RawErrorBody {
  error?: { code?: unknown; message?: unknown; fields?: unknown };
}

async function toApiError(response: Response): Promise<ApiClientError> {
  let body: RawErrorBody = {};

  try {
    body = (await response.json()) as RawErrorBody;
  } catch {
    // Una respuesta sin JSON valido cae al mensaje generico de abajo.
  }

  const code =
    typeof body.error?.code === 'string' ? (body.error.code as ApiErrorCode) : 'INTERNAL_ERROR';
  const message =
    typeof body.error?.message === 'string'
      ? body.error.message
      : `La API respondio ${response.status}`;
  const fields = Array.isArray(body.error?.fields) ? (body.error.fields as FieldError[]) : [];

  return new ApiClientError(code, message, response.status, fields);
}

async function send(path: string, options: RequestOptions): Promise<Response> {
  const headers: Record<string, string> = { Accept: 'application/json' };

  if (options.body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }

  if (!options.anonymous) {
    const tokens = tokenStorage.read();
    if (tokens) {
      headers['Authorization'] = `Bearer ${tokens.accessToken}`;
    }
  }

  return fetch(buildUrl(path, options.params), {
    method: options.method ?? 'GET',
    headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });
}

/**
 * Refresh en curso, compartido entre llamadas.
 *
 * Si tres requests reciben 401 a la vez, tienen que esperar un unico refresh:
 * disparar tres rotaria el token dos veces de mas y dejaria a las otras dos con
 * un refresh token ya consumido.
 */
let pendingRefresh: Promise<boolean> | null = null;

async function refreshSession(): Promise<boolean> {
  const tokens = tokenStorage.read();

  if (!tokens) {
    return false;
  }

  const response = await send('/auth/refresh', {
    method: 'POST',
    body: { refreshToken: tokens.refreshToken },
    anonymous: true,
  });

  if (!response.ok) {
    return false;
  }

  const payload = (await response.json()) as ApiSuccessResponse<AuthSession>;
  tokenStorage.write(payload.data.tokens);
  return true;
}

function refreshOnce(): Promise<boolean> {
  pendingRefresh ??= refreshSession()
    .catch(() => false)
    .finally(() => {
      pendingRefresh = null;
    });

  return pendingRefresh;
}

async function request<TData>(path: string, options: RequestOptions = {}): Promise<TData> {
  let response = await send(path, options);

  // Un 401 con sesion guardada se reintenta una sola vez despues de refrescar.
  if (response.status === 401 && !options.anonymous && tokenStorage.read()) {
    const refreshed = await refreshOnce();

    if (!refreshed) {
      notifyUnauthenticated();
      throw await toApiError(response);
    }

    response = await send(path, options);
  }

  if (!response.ok) {
    if (response.status === 401 && !options.anonymous) {
      notifyUnauthenticated();
    }
    throw await toApiError(response);
  }

  if (response.status === 204) {
    return undefined as TData;
  }

  const payload = (await response.json()) as ApiSuccessResponse<TData>;
  return payload.data;
}

/**
 * Cliente HTTP de la app.
 *
 * Desenvuelve el sobre `ApiResponse`, adjunta el token, refresca la sesion ante
 * un 401 y normaliza los errores. Los services de cada feature lo usan y no
 * vuelven a tocar `fetch`.
 */
export const apiClient = {
  get: <TData>(path: string, params?: QueryParams): Promise<TData> =>
    request<TData>(path, { method: 'GET', params }),

  post: <TData>(path: string, body?: unknown, options?: { anonymous?: boolean }): Promise<TData> =>
    request<TData>(path, { method: 'POST', body, anonymous: options?.anonymous }),

  patch: <TData>(path: string, body?: unknown): Promise<TData> =>
    request<TData>(path, { method: 'PATCH', body }),

  delete: <TData = void>(path: string): Promise<TData> =>
    request<TData>(path, { method: 'DELETE' }),
};
