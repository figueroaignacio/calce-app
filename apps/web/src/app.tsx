import { QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { RouterProvider } from 'react-router-dom';
import { AuthProvider } from '@/features/auth/providers/auth-provider';
import { createQueryClient } from '@/shared/lib/query-client';
import { router } from '@/routes';

/**
 * Composicion raiz.
 *
 * El QueryClient se crea una sola vez por montaje: recrearlo en cada render
 * tiraria la cache entera.
 */
export function App() {
  const [queryClient] = useState(createQueryClient);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
    </QueryClientProvider>
  );
}
