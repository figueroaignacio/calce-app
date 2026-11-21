import { Search } from 'lucide-react';
import { useState } from 'react';
import { CustomersTableContainer } from '@/features/customers/containers/customers-table-container';
import { Input } from '@/shared/components/ui/input';
import { useDebouncedValue } from '@/shared/hooks/use-debounced-value';

export function CustomersListView() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const debouncedSearch = useDebouncedValue(search);
  const isActive = status === 'all' ? undefined : status === 'active';

  return (
    <section className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">Clientes</h1>
        <p className="text-sm text-muted-foreground">
          Gestion comercial y fiscal de clientes de CALCE.
        </p>
      </header>
      <div className="flex flex-wrap items-end gap-3">
        <div className="relative min-w-64 flex-1 max-w-md">
          <Search
            className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            aria-label="Buscar clientes"
            placeholder="Razon social, CUIT o correo..."
            className="pl-9"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
        <div className="space-y-1">
          <label htmlFor="customer-status-filter" className="block text-xs text-muted-foreground">
            Estado
          </label>
          <select
            id="customer-status-filter"
            value={status}
            onChange={(event) => setStatus(event.target.value as typeof status)}
            className="flex h-9 rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="all">Todos</option>
            <option value="active">Activos</option>
            <option value="inactive">Inactivos</option>
          </select>
        </div>
      </div>
      <CustomersTableContainer
        search={debouncedSearch}
        isActive={isActive}
        onClearSearch={() => setSearch('')}
      />
    </section>
  );
}
