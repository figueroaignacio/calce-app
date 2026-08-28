import { type AuthSession, type LoginInput, type RegisterInput, type User } from '@calce/types';
import { apiClient } from '@/shared/lib/api-client';

/**
 * Acceso HTTP de la feature.
 *
 * Es la unica capa que conoce las rutas de la API; los hooks se limitan a
 * envolverla en TanStack Query.
 */
export const authService = {
  login: (input: LoginInput): Promise<AuthSession> =>
    apiClient.post<AuthSession>('/auth/login', input, { anonymous: true }),

  register: (input: RegisterInput): Promise<AuthSession> =>
    apiClient.post<AuthSession>('/auth/register', input, { anonymous: true }),

  me: (): Promise<User> => apiClient.get<User>('/auth/me'),
};
