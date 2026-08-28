import { ORDER_STATUSES } from '@calce/types';
import { relations } from 'drizzle-orm';
import {
  index,
  integer,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { customers } from './customers.js';
import { products } from './products.js';
import { stockMovements } from './stock.js';
import { users } from './users.js';

export const orderStatusEnum = pgEnum('order_status', ORDER_STATUSES);

export const orders = pgTable(
  'orders',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    /** Numero correlativo visible para el cliente, distinto del UUID interno. */
    number: varchar('number', { length: 32 }).notNull(),
    customerId: uuid('customer_id')
      .notNull()
      .references(() => customers.id, { onDelete: 'restrict' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),
    status: orderStatusEnum('status').notNull().default('DRAFT'),
    date: timestamp('date', { withTimezone: true }).notNull().defaultNow(),
    subtotal: numeric('subtotal', { precision: 12, scale: 2, mode: 'number' }).notNull().default(0),
    /** Descuento general del pedido, en porcentaje sobre el subtotal. */
    discount: numeric('discount', { precision: 5, scale: 2, mode: 'number' }).notNull().default(0),
    total: numeric('total', { precision: 12, scale: 2, mode: 'number' }).notNull().default(0),
    notes: text('notes'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('orders_number_key').on(table.number),
    index('orders_customer_idx').on(table.customerId),
    index('orders_status_idx').on(table.status),
    index('orders_date_idx').on(table.date),
  ],
);

/**
 * Renglon del pedido.
 *
 * El precio unitario se copia al momento de la carga: si manana cambia la
 * lista, el pedido historico tiene que seguir mostrando lo que se cobro.
 */
export const orderItems = pgTable(
  'order_items',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    orderId: uuid('order_id')
      .notNull()
      .references(() => orders.id, { onDelete: 'cascade' }),
    productId: uuid('product_id')
      .notNull()
      .references(() => products.id, { onDelete: 'restrict' }),
    quantity: integer('quantity').notNull(),
    unitPrice: numeric('unit_price', { precision: 12, scale: 2, mode: 'number' }).notNull(),
    discount: numeric('discount', { precision: 5, scale: 2, mode: 'number' }).notNull().default(0),
    subtotal: numeric('subtotal', { precision: 12, scale: 2, mode: 'number' }).notNull(),
  },
  (table) => [
    index('order_items_order_idx').on(table.orderId),
    index('order_items_product_idx').on(table.productId),
  ],
);

export const ordersRelations = relations(orders, ({ one, many }) => ({
  customer: one(customers, {
    fields: [orders.customerId],
    references: [customers.id],
  }),
  seller: one(users, {
    fields: [orders.userId],
    references: [users.id],
  }),
  items: many(orderItems),
  stockMovements: many(stockMovements),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
  product: one(products, {
    fields: [orderItems.productId],
    references: [products.id],
  }),
}));

export type OrderRow = typeof orders.$inferSelect;
export type NewOrderRow = typeof orders.$inferInsert;
export type OrderItemRow = typeof orderItems.$inferSelect;
