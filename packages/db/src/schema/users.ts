import { USER_ROLES } from '@calce/types';
import { relations } from 'drizzle-orm';
import {
  boolean,
  index,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { orders } from './orders.js';
import { stockMovements } from './stock.js';

/** Los valores viven en @calce/types para que backend y frontend compartan
 * exactamente la misma lista. */
export const userRoleEnum = pgEnum('user_role', USER_ROLES);

export const users = pgTable(
  'users',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    email: varchar('email', { length: 255 }).notNull().unique(),
    /** Hash argon2id. La contrasena en claro nunca se persiste ni se loguea. */
    passwordHash: text('password_hash').notNull(),
    name: varchar('name', { length: 120 }).notNull(),
    role: userRoleEnum('role').notNull().default('SELLER'),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index('users_role_idx').on(table.role)],
);

export const usersRelations = relations(users, ({ many }) => ({
  orders: many(orders),
  stockMovements: many(stockMovements),
}));

export type UserRow = typeof users.$inferSelect;
export type NewUserRow = typeof users.$inferInsert;
