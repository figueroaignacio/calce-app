import { type User } from '@calce/types';

/** Estado de la sesion expuesto por `useAuth()`. */
export interface AuthState {
  user: User | null;
  /** true mientras se resuelve si hay sesion valida al cargar la app. */
  isLoading: boolean;
  isAuthenticated: boolean;
}

export interface AuthActions {
  login: (email: string, password: string) => Promise<User>;
  logout: () => void;
}

export type AuthContextValue = AuthState & AuthActions;
