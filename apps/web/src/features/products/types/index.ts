import { type ProductSortField, type SortOrder } from '@calce/types';

/**
 * Estado de consulta del listado, en terminos del dominio.
 *
 * Deliberadamente no usa los tipos de TanStack Table: la traduccion a
 * `SortingState` y `PaginationState` vive dentro de la UI de la tabla, que es la
 * unica capa que conoce esa libreria.
 */
export interface ProductsQuery {
  page: number;
  pageSize: number;
  search: string;
  sortBy: ProductSortField;
  sortOrder: SortOrder;
}

export const DEFAULT_PRODUCTS_QUERY: ProductsQuery = {
  page: 1,
  pageSize: 10,
  search: '',
  sortBy: 'sku',
  sortOrder: 'asc',
};
