import { type LoginInput } from '@calce/types';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { LoginFormUi } from '@/features/auth/ui/login-form-ui';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { ApiClientError } from '@/shared/lib/api-client';

function toMessage(error: unknown): string {
  if (error instanceof ApiClientError) {
    return error.message;
  }

  return 'No se pudo conectar con el servidor. Revisa que la API este levantada.';
}

/**
 * Orquesta el login: dispara la mutacion, guarda el token via `useAuth` y
 * navega. La UI no sabe nada de esto.
 */
export function LoginFormContainer({ redirectTo }: { redirectTo: string }) {
  const { login } = useAuth();
  const navigate = useNavigate();

  const mutation = useMutation({
    mutationFn: ({ email, password }: LoginInput) => login(email, password),
    onSuccess: () => {
      void navigate(redirectTo, { replace: true });
    },
  });

  return (
    <LoginFormUi
      onSubmit={(values) => {
        mutation.mutate(values);
      }}
      isSubmitting={mutation.isPending}
      errorMessage={mutation.isError ? toMessage(mutation.error) : null}
    />
  );
}
