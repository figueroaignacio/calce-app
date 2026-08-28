import { createContext } from 'react';
import { type AuthContextValue } from '@/features/auth/types';

/**
 * El contexto arranca en null a proposito: consumirlo fuera del provider es un
 * error de programacion y `useAuth()` lo convierte en una excepcion explicita.
 */
export const AuthContext = createContext<AuthContextValue | null>(null);
