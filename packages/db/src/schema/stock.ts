import { STOCK_MOVEMENT_TYPES } from '@calce/types';
import { relations } from 'drizzle-orm';
import { index, integer, pgEnum, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { orders } from './orders.js';
import { products } from './products.js';
import { users } from './users.js';

export const stockMovementTypeEnum = pgEnum('stock_movement_type', STOCK_MOVEMENT_TYPES);

/**
 * Libro de movimientos de stock.
 *
 * Esta tabla es la fuente de verdad de las existencias: no hay un contador
 * mutable en `products`. Cada asiento persiste `resulting_stock`, la existencia
 * que quedo despues de aplicarlo, como cache de lectura para no tener que
 * sumar la serie completa en cada consulta.
 *
 * Los movimientos son inmutables. Un error se corrige con un asiento de tipo
 * ADJUSTMENT que lo compensa, nunca editando o borrando el original: asi el
 * historial explica por que el stock vale lo que vale.
 *
 * Escribir aca exige una transaccion (leer el ultimo `resulting_stock`, validar
 * y escribir el nuevo asiento deben ser atomicos). Por eso el cliente usa el
 * driver WebSocket de Neon y no el HTTP.
 */
export const stockMovements = pgTable(
  'stock_movements',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    productId: uuid('product_id')
      .notNull()
      .references(() => products.id, { onDelete: 'restrict' }),
    type: stockMovementTypeEnum('type').notNull(),
    /** Positiva o negativa segun el sentido del movimiento; nunca cero. */
    quantity: integer('quantity').notNull(),
    resultingStock: integer('resulting_stock').notNull(),
    /** Pedido que origino el movimiento, si lo hubo. */
    orderId: uuid('order_id').references(() => orders.id, { onDelete: 'set null' }),
    /** Usuario responsable. Nulo solo para movimientos generados por el sistema. */
    userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
    reason: text('reason'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    /** Soporta la consulta caliente: ultimo movimiento de un producto. */
    index('stock_movements_product_created_idx').on(table.productId, table.createdAt),
    index('stock_movements_order_idx').on(table.orderId),
    index('stock_movements_type_idx').on(table.type),
  ],
);

export const stockMovementsRelations = relations(stockMovements, ({ one }) => ({
  product: one(products, {
    fields: [stockMovements.productId],
    references: [products.id],
  }),
  order: one(orders, {
    fields: [stockMovements.orderId],
    references: [orders.id],
  }),
  user: one(users, {
    fields: [stockMovements.userId],
    references: [users.id],
  }),
}));

export type StockMovementRow = typeof stockMovements.$inferSelect;
export type NewStockMovementRow = typeof stockMovements.$inferInsert;
