import {
  PRODUCT_SORT_FIELDS,
  type ProductListItem,
  type ProductSortField,
  type SortOrder,
} from '@calce/types';
import {
  rowPaginationFeature,
  rowSortingFeature,
  tableFeatures,
  useTable,
  type ColumnDef,
  type PaginationState,
  type SortingState,
  type Updater,
} from '@tanstack/react-table';
import { ArrowDown, ArrowUp, ArrowUpDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/components/ui/table';
import { cn, formatCurrency } from '@/shared/lib/utils';

/**
 * Solo se registran las features que la tabla realmente usa. El orden y la
 * paginacion son `manual`: los resuelve el backend y la tabla se limita a
 * reflejar el estado y a avisar cuando el usuario lo cambia.
 */
const features = tableFeatures({ rowSortingFeature, rowPaginationFeature });
type Features = typeof features;

const SORTABLE_FIELDS = new Set<string>(PRODUCT_SORT_FIELDS);

function isSortField(id: string): id is ProductSortField {
  return SORTABLE_FIELDS.has(id);
}

const columns: ColumnDef<Features, ProductListItem>[] = [
  {
    id: 'sku',
    accessorKey: 'sku',
    header: 'SKU',
    enableSorting: true,
    cell: ({ row }) => <span className="tabular font-medium">{row.original.sku}</span>,
  },
  {
    id: 'description',
    accessorKey: 'description',
    header: 'Descripcion',
    enableSorting: true,
    cell: ({ row }) => (
      <div className="min-w-64">
        <p className="truncate">{row.original.description}</p>
        <p className="truncate text-xs text-muted-foreground">
          {row.original.categoryName ?? 'Sin rubro'}
        </p>
      </div>
    ),
  },
  {
    id: 'partBrandName',
    accessorKey: 'partBrandName',
    header: 'Marca',
    enableSorting: false,
    cell: ({ row }) => row.original.partBrandName ?? '-',
  },
  {
    id: 'listPrice',
    accessorKey: 'listPrice',
    header: 'Precio',
    enableSorting: true,
    cell: ({ row }) => <span className="tabular">{formatCurrency(row.original.listPrice)}</span>,
  },
  {
    id: 'stock',
    accessorKey: 'stock',
    header: 'Stock',
    // El stock se deriva del libro de movimientos, no es una columna de
    // `products`, asi que el backend no lo expone como criterio de orden.
    enableSorting: false,
    cell: ({ row }) => {
      const { stock, minStock } = row.original;

      if (stock <= 0) {
        return <Badge variant="destructive">Sin stock</Badge>;
      }

      return (
        <span className="tabular">
          {stock}
          {stock < minStock ? (
            <Badge variant="warning" className="ml-2">
              Bajo minimo
            </Badge>
          ) : null}
        </span>
      );
    },
  },
  {
    id: 'warehouseLocation',
    accessorKey: 'warehouseLocation',
    header: 'Ubicacion',
    enableSorting: false,
    cell: ({ row }) => (
      <span className="tabular text-muted-foreground">{row.original.warehouseLocation ?? '-'}</span>
    ),
  },
];

export interface ProductsTableUiDataProps {
  products: ProductListItem[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  sortBy: ProductSortField;
  sortOrder: SortOrder;
  /** Hay una consulta en vuelo con datos previos todavia en pantalla. */
  isRefreshing: boolean;
  onSortChange: (sortBy: ProductSortField, sortOrder: SortOrder) => void;
  onPageChange: (page: number) => void;
}

/** Estado con datos: `data` es un array con al menos un elemento. */
export function ProductsTableUiData({
  products,
  page,
  pageSize,
  totalItems,
  totalPages,
  sortBy,
  sortOrder,
  isRefreshing,
  onSortChange,
  onPageChange,
}: ProductsTableUiDataProps) {
  const sorting: SortingState = [{ id: sortBy, desc: sortOrder === 'desc' }];
  const pagination: PaginationState = { pageIndex: page - 1, pageSize };

  const handleSortingChange = (updater: Updater<SortingState>): void => {
    const next = typeof updater === 'function' ? updater(sorting) : updater;
    const [first] = next;

    // Quitar el orden por completo dejaria al backend eligiendo uno por default:
    // se conserva el ultimo criterio y solo se invierte la direccion.
    if (!first || !isSortField(first.id)) {
      onSortChange(sortBy, sortOrder === 'asc' ? 'desc' : 'asc');
      return;
    }

    onSortChange(first.id, first.desc ? 'desc' : 'asc');
  };

  const handlePaginationChange = (updater: Updater<PaginationState>): void => {
    const next = typeof updater === 'function' ? updater(pagination) : updater;
    onPageChange(next.pageIndex + 1);
  };

  const table = useTable({
    features,
    data: products,
    columns,
    manualSorting: true,
    manualPagination: true,
    rowCount: totalItems,
    state: { sorting, pagination },
    onSortingChange: handleSortingChange,
    onPaginationChange: handlePaginationChange,
    getRowId: (row) => row.id,
  });

  const firstRow = (page - 1) * pageSize + 1;
  const lastRow = Math.min(page * pageSize, totalItems);

  return (
    <div className="flex flex-col gap-3">
      <div
        className={cn(
          'rounded-xl border border-border bg-card transition-opacity',
          isRefreshing && 'opacity-60',
        )}
      >
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  const canSort = header.column.getCanSort();
                  const direction = header.column.getIsSorted();

                  return (
                    <TableHead key={header.id}>
                      {canSort ? (
                        <button
                          type="button"
                          onClick={header.column.getToggleSortingHandler()}
                          className="inline-flex items-center gap-1 uppercase tracking-wide hover:text-foreground"
                        >
                          <table.FlexRender header={header} />
                          {direction === 'asc' ? <ArrowUp className="size-3" aria-hidden /> : null}
                          {direction === 'desc' ? (
                            <ArrowDown className="size-3" aria-hidden />
                          ) : null}
                          {direction === false ? (
                            <ArrowUpDown className="size-3 opacity-40" aria-hidden />
                          ) : null}
                        </button>
                      ) : (
                        <table.FlexRender header={header} />
                      )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>

          <TableBody>
            {table.getRowModel().rows.map((row) => (
              <TableRow key={row.id}>
                {row.getAllCells().map((cell) => (
                  <TableCell key={cell.id}>
                    <table.FlexRender cell={cell} />
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
        <p>
          Mostrando <span className="tabular text-foreground">{firstRow}</span>-
          <span className="tabular text-foreground">{lastRow}</span> de{' '}
          <span className="tabular text-foreground">{totalItems}</span> productos
        </p>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              table.previousPage();
            }}
            disabled={!table.getCanPreviousPage()}
          >
            <ChevronLeft aria-hidden />
            Anterior
          </Button>

          <span className="tabular">
            {page} / {Math.max(totalPages, 1)}
          </span>

          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              table.nextPage();
            }}
            disabled={!table.getCanNextPage()}
          >
            Siguiente
            <ChevronRight aria-hidden />
          </Button>
        </div>
      </div>
    </div>
  );
}
