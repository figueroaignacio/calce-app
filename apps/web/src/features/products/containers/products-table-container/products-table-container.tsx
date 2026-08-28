import { type ProductListItem, type ProductSortField, type SortOrder } from '@calce/types';
import { useState } from 'react';
import { useProducts } from '@/features/products/hooks/use-products';
import { DEFAULT_PRODUCTS_QUERY, type ProductsQuery } from '@/features/products/types';
import { ProductsTableWidget } from '@/features/products/widgets/products-table-widget';
import { type WidgetData } from '@/shared/types/widget-data';

export interface ProductsTableContainerProps {
  /** Termino de busqueda: lo administra la view, que es quien lo comparte. */
  search: string;
  onClearSearch: () => void;
}

/**
 * Orquesta la informacion del listado.
 *
 * Es el unico lugar que fetchea y el unico que traduce el estado de TanStack
 * Query al contrato `WidgetData`. La paginacion y el orden son estado propio
 * del listado; la busqueda baja de la view.
 */
export function ProductsTableContainer({ search, onClearSearch }: ProductsTableContainerProps) {
  const [page, setPage] = useState(DEFAULT_PRODUCTS_QUERY.page);
  const [sortBy, setSortBy] = useState<ProductSortField>(DEFAULT_PRODUCTS_QUERY.sortBy);
  const [sortOrder, setSortOrder] = useState<SortOrder>(DEFAULT_PRODUCTS_QUERY.sortOrder);

  // Un filtro nuevo cambia el universo de resultados: seguir en la pagina 4
  // mostraria una tabla vacia que parece un error.
  //
  // El ajuste se hace durante el render y no en un efecto: asi React descarta
  // el render en curso y vuelve a renderizar con la pagina ya corregida, sin el
  // parpadeo de pintar una vez con el valor viejo.
  const [lastSearch, setLastSearch] = useState(search);

  if (search !== lastSearch) {
    setLastSearch(search);
    setPage(1);
  }

  const query: ProductsQuery = {
    ...DEFAULT_PRODUCTS_QUERY,
    page,
    search,
    sortBy,
    sortOrder,
  };

  const { data, isLoading, isFetching } = useProducts(query);

  // Mapeo al contrato de tres estados. Es la traduccion que le permite al
  // widget no saber nada de TanStack Query.
  const widgetData: WidgetData<ProductListItem[]> = isLoading
    ? undefined
    : !data || data.items.length === 0
      ? null
      : data.items;

  return (
    <ProductsTableWidget
      data={widgetData}
      search={search}
      page={page}
      pageSize={query.pageSize}
      totalItems={data?.meta.total ?? 0}
      totalPages={data?.meta.totalPages ?? 0}
      sortBy={sortBy}
      sortOrder={sortOrder}
      isRefreshing={isFetching && !isLoading}
      onClearSearch={onClearSearch}
      onPageChange={setPage}
      onSortChange={(nextSortBy, nextSortOrder) => {
        setSortBy(nextSortBy);
        setSortOrder(nextSortOrder);
        setPage(1);
      }}
    />
  );
}
