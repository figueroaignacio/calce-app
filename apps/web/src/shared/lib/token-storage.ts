import { type AuthTokens } from '@calce/types';

const STORAGE_KEY = 'calce.auth.tokens';

/**
 * Persistencia del par de tokens.
 *
 * Se usa `localStorage` para que la sesion sobreviva a un refresh del navegador.
 * Es una decision consciente con una contrapartida: un XSS puede leer el token.
 * Cuando el sistema salga a produccion conviene mover el refresh token a una
 * cookie httpOnly y dejar solo el access token en memoria.
 */
export const tokenStorage = {
  read(): AuthTokens | null {
    const raw = globalThis.localStorage?.getItem(STORAGE_KEY);

    if (!raw) {
      return null;
    }

    try {
      const parsed: unknown = JSON.parse(raw);

      if (
        typeof parsed === 'object' &&
        parsed !== null &&
        'accessToken' in parsed &&
        'refreshToken' in parsed
      ) {
        return parsed as AuthTokens;
      }
    } catch {
      // Un valor corrupto se descarta: equivale a no tener sesion.
    }

    tokenStorage.clear();
    return null;
  },

  write(tokens: AuthTokens): void {
    globalThis.localStorage?.setItem(STORAGE_KEY, JSON.stringify(tokens));
  },

  clear(): void {
    globalThis.localStorage?.removeItem(STORAGE_KEY);
  },
};
