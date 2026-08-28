import { Wrench } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { LoginFormContainer } from '@/features/auth/containers/login-form-container';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/shared/components/ui/card';

interface LocationState {
  from?: string;
}

/**
 * Pantalla de acceso.
 *
 * La view resuelve el estado compartido -a donde volver despues de entrar- y
 * arma el marco visual. El fetch lo hace el container.
 */
export function LoginView() {
  const location = useLocation();
  const state = location.state as LocationState | null;
  const redirectTo = state?.from ?? '/productos';

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/40 px-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="items-start">
          <div className="mb-2 flex size-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Wrench className="size-5" aria-hidden />
          </div>
          <CardTitle>Calce</CardTitle>
          <CardDescription>Gestion comercial para distribuidoras de autopartes</CardDescription>
        </CardHeader>
        <CardContent>
          <LoginFormContainer redirectTo={redirectTo} />
        </CardContent>
      </Card>
    </main>
  );
}
