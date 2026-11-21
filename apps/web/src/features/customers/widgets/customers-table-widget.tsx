import {
  CUSTOMER_SORT_FIELDS,
  type Customer,
  type CustomerSortField,
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
import { useMemo } from 'react';
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
import { cn } from '@/shared/lib/utils';

const features = tableFeatures({ rowSortingFeature, rowPaginationFeature });
type Features = typeof features;
const SORTABLE = new Set<string>(CUSTOMER_SORT_FIELDS);

export interface CustomersTableWidgetProps {
  data: Customer[] | null | undefined;
  search: string;
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  sortBy: CustomerSortField;
  sortOrder: SortOrder;
  canManage: boolean;
  isRefreshing: boolean;
  onSortChange: (field: CustomerSortField, order: SortOrder) => void;
  onPageChange: (page: number) => void;
  onEdit: (customer: Customer) => void;
  onToggleActive: (customer: Customer) => void;
  onClearSearch: () => void;
}

/** Tres estados: undefined=carga, null=vacio, array=datos. */
export function CustomersTableWidget(props: CustomersTableWidgetProps) {
  if (props.data === undefined) return <CustomersTableUiSkeleton />;
  if (props.data === null) {
    return <CustomersTableUiEmpty search={props.search} onClearSearch={props.onClearSearch} />;
  }
  return <CustomersTableUiData {...props} customers={props.data} />;
}

function CustomersTableUiSkeleton() {
  return (
    <div role="status" className="rounded-xl border p-6 text-muted-foreground">
      Cargando clientes...
    </div>
  );
}

function CustomersTableUiEmpty({
  search,
  onClearSearch,
}: {
  search: string;
  onClearSearch: () => void;
}) {
  return (
    <div className="rounded-xl border bg-card p-8 text-center space-y-2">
      <p>
        {search
          ? `No hay clientes que coincidan con "${search}"`
          : 'Todavia no hay clientes para mostrar'}
      </p>
      {search ? (
        <Button type="button" variant="outline" onClick={onClearSearch}>
          Limpiar busqueda
        </Button>
      ) : null}
    </div>
  );
}

function CustomersTableUiData({
  customers,
  page,
  pageSize,
  totalItems,
  totalPages,
  sortBy,
  sortOrder,
  isRefreshing,
  canManage,
  onEdit,
  onToggleActive,
  onSortChange,
  onPageChange,
}: Omit<CustomersTableWidgetProps, 'data'> & { customers: Customer[] }) {
  const columns = useMemo<ColumnDef<Features, Customer>[]>(
    () => [
      {
        id: 'businessName',
        accessorKey: 'businessName',
        header: 'Razon social',
        cell: ({ row }) => <span className="font-medium">{row.original.businessName}</span>,
      },
      { id: 'taxId', accessorKey: 'taxId', header: 'CUIT' },
      {
        id: 'taxCondition',
        accessorKey: 'taxCondition',
        header: 'Condicion IVA',
        enableSorting: false,
        cell: ({ row }) => row.original.taxCondition.replaceAll('_', ' '),
      },
      {
        id: 'email',
        accessorKey: 'email',
        header: 'Correo',
        enableSorting: false,
        cell: ({ row }) => row.original.email ?? '-',
      },
      {
        id: 'isActive',
        accessorKey: 'isActive',
        header: 'Estado',
        enableSorting: false,
        cell: ({ row }) => (
          <Badge variant={row.original.isActive ? 'success' : 'secondary'}>
            {row.original.isActive ? 'Activo' : 'Inactivo'}
          </Badge>
        ),
      },
      {
        id: 'actions',
        header: 'Acciones',
        enableSorting: false,
        cell: ({ row }) =>
          canManage ? (
            <div className="flex gap-1">
              <Button
                size="sm"
                variant="outline"
                type="button"
                onClick={() => onEdit(row.original)}
              >
                Editar
              </Button>
              <Button
                size="sm"
                variant={row.original.isActive ? 'destructive' : 'outline'}
                type="button"
                onClick={() => onToggleActive(row.original)}
              >
                {row.original.isActive ? 'Desactivar' : 'Reactivar'}
              </Button>
            </div>
          ) : (
            <span className="text-muted-foreground">-</span>
          ),
      },
    ],
    [canManage, onEdit, onToggleActive],
  );

  const sorting: SortingState = [{ id: sortBy, desc: sortOrder === 'desc' }];
  const pagination: PaginationState = { pageIndex: page - 1, pageSize };

  const handleSortingChange = (updater: Updater<SortingState>) => {
    const next = typeof updater === 'function' ? updater(sorting) : updater;
    const first = next[0];
    if (!first || !SORTABLE.has(first.id)) {
      onSortChange(sortBy, sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      onSortChange(first.id as CustomerSortField, first.desc ? 'desc' : 'asc');
    }
  };

  const handlePaginationChange = (updater: Updater<PaginationState>) => {
    const next = typeof updater === 'function' ? updater(pagination) : updater;
    onPageChange(next.pageIndex + 1);
  };

  const table = useTable({
    features,
    data: customers,
    columns,
    manualSorting: true,
    manualPagination: true,
    rowCount: totalItems,
    state: { sorting, pagination },
    onSortingChange: handleSortingChange,
    onPaginationChange: handlePaginationChange,
    getRowId: (row) => row.id,
  });

  return (
    <div className="flex flex-col gap-3">
      <div
        className={cn('rounded-xl border bg-card transition-opacity', isRefreshing && 'opacity-60')}
      >
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((group) => (
              <TableRow key={group.id}>
                {group.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.column.getCanSort() && SORTABLE.has(header.column.id) ? (
                      <button
                        type="button"
                        className="inline-flex items-center gap-1 hover:text-foreground"
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        <table.FlexRender header={header} />
                        {header.column.getIsSorted() === 'asc' ? (
                          <ArrowUp className="size-3" />
                        ) : null}
                        {header.column.getIsSorted() === 'desc' ? (
                          <ArrowDown className="size-3" />
                        ) : null}
                        {header.column.getIsSorted() === false ? (
                          <ArrowUpDown className="size-3 opacity-40" />
                        ) : null}
                      </button>
                    ) : (
                      <table.FlexRender header={header} />
                    )}
                  </TableHead>
                ))}
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
      <div className="flex flex-wrap justify-between items-center gap-3 text-sm text-muted-foreground">
        <span>
          Mostrando {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, totalItems)} de{' '}
          {totalItems} clientes
        </span>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={!table.getCanPreviousPage()}
            onClick={() => table.previousPage()}
          >
            <ChevronLeft /> Anterior
          </Button>
          <span>
            {page} / {Math.max(1, totalPages)}
          </span>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={!table.getCanNextPage()}
            onClick={() => table.nextPage()}
          >
            Siguiente <ChevronRight />
          </Button>
        </div>
      </div>
    </div>
  );
}
