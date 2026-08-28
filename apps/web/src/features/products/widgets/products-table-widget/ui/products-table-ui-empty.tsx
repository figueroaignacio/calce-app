import { PackageSearch } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';

export interface ProductsTableUiEmptyProps {
  /** Termino que no dio resultados; vacio si el catalogo esta sin cargar. */
  search: string;
  onClearSearch: () => void;
}

/** Estado sin resultados: `data === null`. */
export function ProductsTableUiEmpty({ search, onClearSearch }: ProductsTableUiEmptyProps) {
  const hasSearch = search.trim().length > 0;

  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border bg-card px-6 py-16 text-center">
      <div className="flex size-11 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <PackageSearch className="size-5" aria-hidden />
      </div>

      <div className="space-y-1">
        <p className="text-sm font-medium">
          {hasSearch ? `Ningun producto coincide con "${search}"` : 'Todavia no hay productos'}
        </p>
        <p className="text-sm text-muted-foreground">
          {hasSearch
            ? 'Probá con el codigo OEM, el codigo del fabricante o parte de la descripcion.'
            : 'Cargá el catalogo para empezar a operar.'}
        </p>
      </div>

      {hasSearch ? (
        <Button variant="outline" size="sm" onClick={onClearSearch}>
          Limpiar busqueda
        </Button>
      ) : null}
    </div>
  );
}
