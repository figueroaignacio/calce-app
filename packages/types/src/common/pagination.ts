import { z } from 'zod';

export const DEFAULT_PAGE = 1;
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

export const SORT_ORDERS = ['asc', 'desc'] as const;
export const sortOrderSchema = z.enum(SORT_ORDERS);
export type SortOrder = z.infer<typeof sortOrderSchema>;

/**
 * Parametros de paginacion.
 *
 * Se usa `coerce` porque los query params llegan siempre como string.
 */
export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(DEFAULT_PAGE),
  pageSize: z.coerce.number().int().positive().max(MAX_PAGE_SIZE).default(DEFAULT_PAGE_SIZE),
});
export type PaginationQuery = z.infer<typeof paginationQuerySchema>;

/** Metadatos que acompanian a toda coleccion paginada. */
export const paginationMetaSchema = z.object({
  page: z.number().int().positive(),
  pageSize: z.number().int().positive(),
  total: z.number().int().nonnegative(),
  totalPages: z.number().int().nonnegative(),
  hasNextPage: z.boolean(),
  hasPreviousPage: z.boolean(),
});
export type PaginationMeta = z.infer<typeof paginationMetaSchema>;

/** Respuesta paginada generica. */
export interface PaginatedResponse<TItem> {
  items: TItem[];
  meta: PaginationMeta;
}

export function paginatedResponseSchema<TItem extends z.ZodType>(itemSchema: TItem) {
  return z.object({
    items: z.array(itemSchema),
    meta: paginationMetaSchema,
  });
}

/** Construye los metadatos de paginacion a partir del total de registros. */
export function buildPaginationMeta(page: number, pageSize: number, total: number): PaginationMeta {
  const totalPages = pageSize > 0 ? Math.ceil(total / pageSize) : 0;
  return {
    page,
    pageSize,
    total,
    totalPages,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1 && totalPages > 0,
  };
}
