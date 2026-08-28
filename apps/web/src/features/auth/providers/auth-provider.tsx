import { type User } from '@calce/types';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { AuthContext } from '@/features/auth/context/auth-context';
import { authService } from '@/features/auth/services/auth.service';
import { type AuthContextValue } from '@/features/auth/types';
import { onUnauthenticated } from '@/shared/lib/api-client';
import { tokenStorage } from '@/shared/lib/token-storage';

/**
 * Fuente de verdad de la sesion.
 *
 * El token guardado no alcanza para dar por buena la sesion: puede estar vencido
 * o el usuario haber sido dado de baja. Por eso al montar se revalida contra
 * `/auth/me` y hasta que eso resuelva el estado queda en "cargando".
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [hasToken, setHasToken] = useState(() => tokenStorage.read() !== null);

  const { data: user, isLoading } = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: authService.me,
    enabled: hasToken,
    retry: false,
    staleTime: Infinity,
  });

  const logout = useCallback(() => {
    tokenStorage.clear();
    setHasToken(false);
    queryClient.clear();
  }, [queryClient]);

  // El cliente HTTP avisa cuando el refresh fallo y la sesion es irrecuperable.
  useEffect(() => onUnauthenticated(logout), [logout]);

  const login = useCallback(
    async (email: string, password: string): Promise<User> => {
      const session = await authService.login({ email, password });

      tokenStorage.write(session.tokens);
      setHasToken(true);
      queryClient.setQueryData(['auth', 'me'], session.user);

      return session.user;
    },
    [queryClient],
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      user: user ?? null,
      isLoading: hasToken && isLoading,
      isAuthenticated: Boolean(user),
      login,
      logout,
    }),
    [user, hasToken, isLoading, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
