import { TAX_CONDITIONS } from '@calce/types';
import { relations } from 'drizzle-orm';
import {
  boolean,
  char,
  index,
  pgEnum,
  pgTable,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { orders } from './orders.js';

export const taxConditionEnum = pgEnum('tax_condition', TAX_CONDITIONS);

export const customers = pgTable(
  'customers',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    businessName: varchar('business_name', { length: 200 }).notNull(),
    /** CUIT sin guiones. */
    taxId: char('tax_id', { length: 11 }).notNull(),
    taxCondition: taxConditionEnum('tax_condition').notNull().default('RESPONSABLE_INSCRIPTO'),
    email: varchar('email', { length: 255 }),
    phone: varchar('phone', { length: 40 }),
    address: varchar('address', { length: 200 }),
    /**
     * Lista de precios asignada al cliente. Se deja como referencia suelta
     * porque el modulo de listas de precios todavia no existe; cuando se cree
     * la tabla `price_lists` esta columna pasa a ser clave foranea.
     */
    priceListId: uuid('price_list_id'),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('customers_tax_id_key').on(table.taxId),
    index('customers_business_name_idx').on(table.businessName),
  ],
);

export const customersRelations = relations(customers, ({ many }) => ({
  orders: many(orders),
}));

export type CustomerRow = typeof customers.$inferSelect;
export type NewCustomerRow = typeof customers.$inferInsert;
