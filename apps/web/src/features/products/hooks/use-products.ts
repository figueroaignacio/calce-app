import { type PaginatedResponse, type ProductListItem } from '@calce/types';
import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { productsService } from '@/features/products/services/products.service';
import { type ProductsQuery } from '@/features/products/types';

/** Claves de cache de la feature, en un solo lugar para poder invalidarlas. */
export const productsKeys = {
  all: ['products'] as const,
  list: (query: ProductsQuery) => [...productsKeys.all, 'list', query] as const,
  detail: (id: string) => [...productsKeys.all, 'detail', id] as const,
};

export function useProducts(
  query: ProductsQuery,
): UseQueryResult<PaginatedResponse<ProductListItem>> {
  return useQuery({
    queryKey: productsKeys.list(query),
    queryFn: () => productsService.list(query),
    // Al cambiar de pagina se conserva la anterior en pantalla para que la
    // tabla no colapse a skeleton en cada click.
    placeholderData: (previous) => previous,
  });
}
