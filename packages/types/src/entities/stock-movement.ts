import { z } from 'zod';
import { idSchema, timestampSchema } from '../common/primitives.js';
import { paginationQuerySchema, sortOrderSchema } from '../common/pagination.js';
import { stockMovementTypeSchema } from '../enums/stock-movement-type.js';

/**
 * Asiento del libro de stock.
 *
 * `resultingStock` guarda la existencia que quedo despues de aplicar el
 * movimiento. Es una cache de lectura: la verdad sigue siendo la suma de la
 * serie completa de movimientos del producto.
 */
export const stockMovementSchema = z.object({
  id: idSchema,
  productId: idSchema,
  type: stockMovementTypeSchema,
  /** Positiva o negativa segun el sentido del movimiento; nunca cero. */
  quantity: z.number().int(),
  resultingStock: z.number().int(),
  orderId: idSchema.nullable(),
  userId: idSchema.nullable(),
  reason: z.string().max(300).nullable(),
  createdAt: timestampSchema,
});
export type StockMovement = z.infer<typeof stockMovementSchema>;

export const stockMovementDetailSchema = stockMovementSchema.extend({
  sku: z.string(),
  description: z.string(),
  userName: z.string().nullable(),
});
export type StockMovementDetail = z.infer<typeof stockMovementDetailSchema>;

export const createStockMovementSchema = z.object({
  productId: idSchema,
  type: stockMovementTypeSchema,
  quantity: z
    .number()
    .int()
    .refine((value) => value !== 0, 'La cantidad no puede ser cero'),
  reason: z.string().max(300).nullable().default(null),
});
export type CreateStockMovementInput = z.infer<typeof createStockMovementSchema>;

/** Existencia actual de un producto, derivada del ultimo movimiento. */
export const stockLevelSchema = z.object({
  productId: idSchema,
  sku: z.string(),
  description: z.string(),
  onHand: z.number().int(),
  reserved: z.number().int(),
  available: z.number().int(),
  minStock: z.number().int(),
  belowMinimum: z.boolean(),
});
export type StockLevel = z.infer<typeof stockLevelSchema>;

export const queryStockMovementsSchema = paginationQuerySchema.extend({
  productId: idSchema.optional(),
  type: stockMovementTypeSchema.optional(),
  dateFrom: timestampSchema.optional(),
  dateTo: timestampSchema.optional(),
  sortOrder: sortOrderSchema.default('desc'),
});
export type QueryStockMovementsInput = z.infer<typeof queryStockMovementsSchema>;
