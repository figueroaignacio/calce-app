import { Skeleton } from '@/shared/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/components/ui/table';

const COLUMN_WIDTHS = ['w-28', 'w-full', 'w-24', 'w-20', 'w-12', 'w-16'];
const PLACEHOLDER_ROWS = 8;

/** Estado de carga: `data === undefined`. */
export function ProductsTableUiSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-card" aria-busy="true" aria-live="polite">
      <Table>
        <TableHeader>
          <TableRow>
            {COLUMN_WIDTHS.map((width) => (
              <TableHead key={width}>
                <Skeleton className="h-3 w-16" />
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: PLACEHOLDER_ROWS }, (_, index) => index).map((rowIndex) => (
            <TableRow key={rowIndex}>
              {COLUMN_WIDTHS.map((width) => (
                <TableCell key={width}>
                  <Skeleton className={`h-4 ${width}`} />
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <span className="sr-only">Cargando productos</span>
    </div>
  );
}
