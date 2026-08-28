import type { ComponentProps } from 'react';
import { cn } from '@/shared/lib/utils';

/** Bloque gris animado que ocupa el lugar del contenido mientras carga. */
export function Skeleton({ className, ...props }: ComponentProps<'div'>) {
  return <div className={cn('animate-pulse rounded-md bg-muted', className)} {...props} />;
}
