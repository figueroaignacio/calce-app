import { type Customer, type CustomerSortField, type SortOrder } from '@calce/types';
import { useState } from 'react';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { useCustomerMutations, useCustomers } from '@/features/customers/hooks/use-customers';
import { DEFAULT_CUSTOMERS_QUERY, type CustomersQuery } from '@/features/customers/types';
import { CustomerForm } from '@/features/customers/ui/customer-form';
import { CustomersTableWidget } from '@/features/customers/widgets/customers-table-widget';
import { Button } from '@/shared/components/ui/button';

export interface CustomersTableContainerProps {
  search: string;
  isActive?: boolean;
  onClearSearch: () => void;
}

/** Orquesta consultas, mutaciones, formulario y tabla, sin SQL ni HTTP directo. */
export function CustomersTableContainer({
  search,
  isActive,
  onClearSearch,
}: CustomersTableContainerProps) {
  const { user } = useAuth();
  const canManage = user?.role === 'ADMIN';
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState<CustomerSortField>('businessName');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [editing, setEditing] = useState<Customer | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [lastFilters, setLastFilters] = useState({ search, isActive });

  if (lastFilters.search !== search || lastFilters.isActive !== isActive) {
    setLastFilters({ search, isActive });
    setPage(1);
  }

  const query: CustomersQuery = {
    ...DEFAULT_CUSTOMERS_QUERY,
    page,
    sortBy,
    sortOrder,
    search,
    isActive,
  };
  const { data, isLoading, isFetching, error, refetch } = useCustomers(query);
  const mutations = useCustomerMutations();
  const busy =
    mutations.create.isPending || mutations.update.isPending || mutations.deactivate.isPending;

  async function saveCustomer(input: Parameters<typeof mutations.create.mutateAsync>[0]) {
    if (editing) {
      await mutations.update.mutateAsync({ id: editing.id, changes: input });
      setMessage('Cliente actualizado correctamente');
    } else {
      await mutations.create.mutateAsync(input);
      setMessage('Cliente creado correctamente');
      setPage(1);
    }
    setFormOpen(false);
    setEditing(null);
  }

  async function toggleActive(customer: Customer) {
    if (customer.isActive) {
      if (!window.confirm(`Dar de baja a ${customer.businessName}?`)) return;
      try {
        await mutations.deactivate.mutateAsync(customer.id);
        setMessage('Cliente desactivado correctamente');
      } catch (reason) {
        setMessage(reason instanceof Error ? reason.message : 'No se pudo desactivar el cliente');
      }
    } else {
      try {
        await mutations.update.mutateAsync({ id: customer.id, changes: { isActive: true } });
        setMessage('Cliente reactivado correctamente');
      } catch (reason) {
        setMessage(reason instanceof Error ? reason.message : 'No se pudo reactivar el cliente');
      }
    }
  }

  const widgetData = isLoading ? undefined : !data || data.items.length === 0 ? null : data.items;

  return (
    <div className="flex flex-col gap-4">
      {canManage ? (
        <div className="flex justify-end">
          <Button
            type="button"
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
              setMessage('');
            }}
          >
            Nuevo cliente
          </Button>
        </div>
      ) : null}
      {formOpen && canManage ? (
        <CustomerForm
          key={editing?.id ?? 'new'}
          initial={editing}
          busy={busy}
          onSave={saveCustomer}
          onCancel={() => {
            setFormOpen(false);
            setEditing(null);
          }}
        />
      ) : null}
      {message ? (
        <p role="status" className="text-sm">
          {message}
        </p>
      ) : null}
      {error ? (
        <div role="alert" className="rounded-xl border border-destructive p-4 text-sm">
          No se pudieron cargar los clientes: {error.message}{' '}
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => {
              void refetch();
            }}
          >
            Reintentar
          </Button>
        </div>
      ) : (
        <CustomersTableWidget
          data={widgetData}
          search={search}
          page={page}
          pageSize={query.pageSize}
          totalItems={data?.meta.total ?? 0}
          totalPages={data?.meta.totalPages ?? 0}
          sortBy={sortBy}
          sortOrder={sortOrder}
          canManage={canManage}
          isRefreshing={isFetching && !isLoading}
          onSortChange={(field, order) => {
            setSortBy(field);
            setSortOrder(order);
            setPage(1);
          }}
          onPageChange={setPage}
          onEdit={(customer) => {
            setEditing(customer);
            setFormOpen(true);
            setMessage('');
          }}
          onToggleActive={(customer) => {
            void toggleActive(customer);
          }}
          onClearSearch={onClearSearch}
        />
      )}
    </div>
  );
}
