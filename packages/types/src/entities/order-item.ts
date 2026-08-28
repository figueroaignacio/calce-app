import { z } from 'zod';
import { idSchema, moneySchema, percentageSchema } from '../common/primitives.js';

/** Renglon de un pedido. El precio queda congelado al momento de la carga. */
export const orderItemSchema = z.object({
  id: idSchema,
  orderId: idSchema,
  productId: idSchema,
  quantity: z.number().int().positive(),
  unitPrice: moneySchema,
  discount: percentageSchema,
  subtotal: moneySchema,
});
export type OrderItem = z.infer<typeof orderItemSchema>;

/** Renglon con los datos del producto ya resueltos, para mostrar el pedido. */
export const orderItemDetailSchema = orderItemSchema.extend({
  sku: z.string(),
  description: z.string(),
});
export type OrderItemDetail = z.infer<typeof orderItemDetailSchema>;

export const createOrderItemSchema = z.object({
  productId: idSchema,
  quantity: z.number().int().positive(),
  /** Si se omite, el backend toma el precio de lista vigente del producto. */
  unitPrice: moneySchema.optional(),
  discount: percentageSchema.default(0),
});
export type CreateOrderItemInput = z.infer<typeof createOrderItemSchema>;
