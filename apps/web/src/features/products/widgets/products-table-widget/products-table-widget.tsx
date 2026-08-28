import { type ProductListItem, type ProductSortField, type SortOrder } from '@calce/types';
import { type WidgetData } from '@/shared/types/widget-data';
import { ProductsTableUiData } from './ui/products-table-ui-data';
import { ProductsTableUiEmpty } from './ui/products-table-ui-empty';
import { ProductsTableUiSkeleton } from './ui/products-table-ui-skeleton';

export interface ProductsTableWidgetProps {
  data: WidgetData<ProductListItem[]>;
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  search: string;
  sortBy: ProductSortField;
  sortOrder: SortOrder;
  isRefreshing: boolean;
  onSortChange: (sortBy: ProductSortField, sortOrder: SortOrder) => void;
  onPageChange: (page: number) => void;
  onClearSearch: () => void;
}

/**
 * Widget de la tabla de productos.
 *
 * Todo su trabajo es despachar entre las tres UI segun el estado en que llega
 * la data. No fetchea, no transforma y no decide nada mas: si aca aparece un
 * `if` que no sea uno de estos tres, la logica esta en la capa equivocada.
 */
export function ProductsTableWidget({
  data,
  search,
  onClearSearch,
  ...tableProps
}: ProductsTableWidgetProps) {
  if (data === undefined) {
    return <ProductsTableUiSkeleton />;
  }

  if (data === null) {
    return <ProductsTableUiEmpty search={search} onClearSearch={onClearSearch} />;
  }

  return <ProductsTableUiData products={data} {...tableProps} />;
}
