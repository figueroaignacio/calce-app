import { Search } from 'lucide-react';
import { useState } from 'react';
import { ProductsTableContainer } from '@/features/products/containers/products-table-container';
import { Input } from '@/shared/components/ui/input';
import { useDebouncedValue } from '@/shared/hooks/use-debounced-value';

/**
 * Pantalla del catalogo.
 *
 * La view administra el estado compartido de la pagina -el termino de busqueda-
 * y arma el layout. No fetchea: de eso se encarga el container.
 */
export function ProductsListView() {
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search);

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">Catalogo</h1>
        <p className="text-sm text-muted-foreground">
          Busca por SKU, descripcion o cualquiera de los codigos: OEM, del fabricante o interno.
        </p>
      </header>

      <div className="relative max-w-md">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <Input
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
          }}
          placeholder="filtro aceite gol, PH5796, FIL-AC-0001..."
          className="pl-9"
          aria-label="Buscar productos"
        />
      </div>

      <ProductsTableContainer
        search={debouncedSearch}
        onClearSearch={() => {
          setSearch('');
        }}
      />
    </div>
  );
}
