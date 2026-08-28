import { useContext } from 'react';
import { AuthContext } from '@/features/auth/context/auth-context';
import { type AuthContextValue } from '@/features/auth/types';

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth() necesita estar dentro de <AuthProvider>');
  }

  return context;
}
