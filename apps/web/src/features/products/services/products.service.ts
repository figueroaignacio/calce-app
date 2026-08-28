import { type PaginatedResponse, type ProductDetail, type ProductListItem } from '@calce/types';
import { type ProductsQuery } from '@/features/products/types';
import { apiClient } from '@/shared/lib/api-client';

export const productsService = {
  list: (query: ProductsQuery): Promise<PaginatedResponse<ProductListItem>> =>
    apiClient.get<PaginatedResponse<ProductListItem>>('/products', {
      page: query.page,
      pageSize: query.pageSize,
      // El cliente no manda `search` vacio: el backend lo tomaria como filtro.
      search: query.search.trim() || undefined,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
    }),

  detail: (id: string): Promise<ProductDetail> => apiClient.get<ProductDetail>(`/products/${id}`),
};
