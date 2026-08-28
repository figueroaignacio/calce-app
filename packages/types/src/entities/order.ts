import { z } from 'zod';
import {
  auditFieldsSchema,
  idSchema,
  moneySchema,
  percentageSchema,
  timestampSchema,
} from '../common/primitives.js';
import { paginationQuerySchema, sortOrderSchema } from '../common/pagination.js';
import { orderStatusSchema } from '../enums/order-status.js';
import { createOrderItemSchema, orderItemDetailSchema } from './order-item.js';

export const orderSchema = z
  .object({
    id: idSchema,
    /** Numero correlativo visible para el cliente, distinto del UUID interno. */
    number: z.string().min(1).max(32),
    customerId: idSchema,
    userId: idSchema,
    status: orderStatusSchema,
    date: timestampSchema,
    subtotal: moneySchema,
    discount: percentageSchema,
    total: moneySchema,
    notes: z.string().max(1000).nullable(),
  })
  .extend(auditFieldsSchema.shape);
export type Order = z.infer<typeof orderSchema>;

export const orderListItemSchema = orderSchema.extend({
  customerName: z.string(),
  sellerName: z.string(),
  itemCount: z.number().int().nonnegative(),
});
export type OrderListItem = z.infer<typeof orderListItemSchema>;

export const orderDetailSchema = orderListItemSchema.extend({
  items: z.array(orderItemDetailSchema),
});
export type OrderDetail = z.infer<typeof orderDetailSchema>;

export const createOrderSchema = z.object({
  customerId: idSchema,
  discount: percentageSchema.default(0),
  notes: z.string().max(1000).nullable().default(null),
  items: z.array(createOrderItemSchema).min(1, 'El pedido necesita al menos un renglon'),
});
export type CreateOrderInput = z.infer<typeof createOrderSchema>;

export const updateOrderStatusSchema = z.object({
  status: orderStatusSchema,
});
export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;

export const ORDER_SORT_FIELDS = ['number', 'date', 'total', 'status', 'createdAt'] as const;
export const orderSortFieldSchema = z.enum(ORDER_SORT_FIELDS);
export type OrderSortField = z.infer<typeof orderSortFieldSchema>;

export const queryOrdersSchema = paginationQuerySchema.extend({
  search: z.string().trim().max(120).optional(),
  customerId: idSchema.optional(),
  status: orderStatusSchema.optional(),
  dateFrom: timestampSchema.optional(),
  dateTo: timestampSchema.optional(),
  sortBy: orderSortFieldSchema.default('date'),
  sortOrder: sortOrderSchema.default('desc'),
});
export type QueryOrdersInput = z.infer<typeof queryOrdersSchema>;
