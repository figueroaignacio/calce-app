import { type UserRole } from '@calce/types';
import { LoaderCircle } from 'lucide-react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/features/auth/hooks/use-auth';

export interface ProtectedRouteProps {
  /** Roles habilitados. Sin este prop alcanza con estar autenticado. */
  roles?: UserRole[];
}

/**
 * Puerta de las rutas privadas.
 *
 * Mientras se revalida la sesion no se decide nada: redirigir al login en ese
 * momento sacaria del sistema a un usuario que si tiene sesion valida, solo
 * porque `/auth/me` todavia no respondio.
 */
export function ProtectedRoute({ roles }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <LoaderCircle className="size-6 animate-spin text-muted-foreground" aria-hidden />
        <span className="sr-only">Verificando sesion</span>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  if (roles && roles.length > 0 && (!user || !roles.includes(user.role))) {
    return <Navigate to="/productos" replace />;
  }

  return <Outlet />;
}
