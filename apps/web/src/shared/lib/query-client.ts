import { QueryClient } from '@tanstack/react-query';
import { ApiClientError } from './api-client';

/**
 * Configuracion unica de TanStack Query.
 *
 * No se reintenta ante errores de cliente (4xx): un 404 o un 403 no se arreglan
 * repitiendo la request, y reintentarlos solo suma latencia.
 */
export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        refetchOnWindowFocus: false,
        retry: (failureCount, error) => {
          if (error instanceof ApiClientError && error.statusCode < 500) {
            return false;
          }
          return failureCount < 2;
        },
      },
      mutations: {
        retry: false,
      },
    },
  });
}
