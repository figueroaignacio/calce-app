import { PRODUCT_CODE_TYPES } from '@calce/types';
import { relations } from 'drizzle-orm';
import {
  type AnyPgColumn,
  boolean,
  index,
  integer,
  numeric,
  pgEnum,
  pgTable,
  smallint,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
  vector,
} from 'drizzle-orm/pg-core';
import { orderItems } from './orders.js';
import { stockMovements } from './stock.js';
import { vehicleVersions } from './vehicles.js';

export const productCodeTypeEnum = pgEnum('product_code_type', PRODUCT_CODE_TYPES);

/** Rubro del catalogo, con un nivel padre opcional para armar familias. */
export const categories = pgTable(
  'categories',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: varchar('name', { length: 120 }).notNull(),
    parentId: uuid('parent_id').references((): AnyPgColumn => categories.id, {
      onDelete: 'set null',
    }),
  },
  (table) => [
    uniqueIndex('categories_name_key').on(table.name),
    index('categories_parent_idx').on(table.parentId),
  ],
);

/** Fabricante de la pieza. Distinto de la terminal automotriz. */
export const partBrands = pgTable(
  'part_brands',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: varchar('name', { length: 120 }).notNull(),
  },
  (table) => [uniqueIndex('part_brands_name_key').on(table.name)],
);

/**
 * Catalogo de repuestos.
 *
 * Nota de diseno: `products` NO tiene columna de stock. La existencia se
 * deriva del libro de `stock_movements`, que guarda en cada asiento el
 * `resulting_stock` como cache de lectura. Mantener un contador mutable aca
 * significaria perder la trazabilidad de por que el stock vale lo que vale,
 * que es justamente el problema que el sistema viene a resolver.
 */
export const products = pgTable(
  'products',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    sku: varchar('sku', { length: 64 }).notNull(),
    description: varchar('description', { length: 500 }).notNull(),
    /**
     * Descripcion sin acentos, abreviaturas ni ruido, generada por el backend.
     * Es la que alimenta la busqueda por texto y, mas adelante, el embedding.
     */
    normalizedDescription: varchar('normalized_description', { length: 500 }),
    partBrandId: uuid('part_brand_id').references(() => partBrands.id, { onDelete: 'set null' }),
    categoryId: uuid('category_id').references(() => categories.id, { onDelete: 'set null' }),
    listPrice: numeric('list_price', { precision: 12, scale: 2, mode: 'number' })
      .notNull()
      .default(0),
    minStock: integer('min_stock').notNull().default(0),
    warehouseLocation: varchar('warehouse_location', { length: 64 }),
    /**
     * Embedding de la descripcion normalizada para la busqueda semantica.
     * Queda nulo hasta que el modulo de IA lo calcule; 1536 dimensiones para
     * coincidir con los modelos de embeddings mas usados.
     */
    embedding: vector('embedding', { dimensions: 1536 }),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('products_sku_key').on(table.sku),
    index('products_category_idx').on(table.categoryId),
    index('products_part_brand_idx').on(table.partBrandId),
    index('products_description_idx').on(table.normalizedDescription),
    /** Indice HNSW con distancia coseno para la busqueda por similitud. */
    index('products_embedding_hnsw_idx').using('hnsw', table.embedding.op('vector_cosine_ops')),
  ],
);

/**
 * Codigos por los que se puede encontrar un producto.
 *
 * Un repuesto suele tener el codigo de la terminal, el del fabricante y el
 * interno de la distribuidora. La busqueda tiene que resolver los tres.
 */
export const productCodes = pgTable(
  'product_codes',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    productId: uuid('product_id')
      .notNull()
      .references(() => products.id, { onDelete: 'cascade' }),
    type: productCodeTypeEnum('type').notNull(),
    code: varchar('code', { length: 64 }).notNull(),
  },
  (table) => [
    uniqueIndex('product_codes_type_code_key').on(table.type, table.code, table.productId),
    index('product_codes_code_idx').on(table.code),
    index('product_codes_product_idx').on(table.productId),
  ],
);

/**
 * Aplicacion vehicular: el nucleo del dominio.
 *
 * Declara para que version de vehiculo sirve la pieza y en que rango de anios.
 * `year_to` nulo significa "hasta la actualidad".
 */
export const productApplications = pgTable(
  'product_applications',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    productId: uuid('product_id')
      .notNull()
      .references(() => products.id, { onDelete: 'cascade' }),
    vehicleVersionId: uuid('vehicle_version_id')
      .notNull()
      .references(() => vehicleVersions.id, { onDelete: 'restrict' }),
    yearFrom: smallint('year_from').notNull(),
    yearTo: smallint('year_to'),
  },
  (table) => [
    index('product_applications_product_idx').on(table.productId),
    index('product_applications_version_idx').on(table.vehicleVersionId),
    uniqueIndex('product_applications_unique_key').on(
      table.productId,
      table.vehicleVersionId,
      table.yearFrom,
    ),
  ],
);

/**
 * Equivalencias entre productos: dos piezas de fabricantes distintos que
 * cumplen la misma funcion. La relacion es autorreferencial y se carga en
 * ambos sentidos para poder consultarla desde cualquiera de los dos lados.
 */
export const productEquivalences = pgTable(
  'product_equivalences',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    productId: uuid('product_id')
      .notNull()
      .references(() => products.id, { onDelete: 'cascade' }),
    equivalentProductId: uuid('equivalent_product_id')
      .notNull()
      .references(() => products.id, { onDelete: 'cascade' }),
    notes: text('notes'),
  },
  (table) => [
    uniqueIndex('product_equivalences_pair_key').on(table.productId, table.equivalentProductId),
    index('product_equivalences_product_idx').on(table.productId),
  ],
);

export const categoriesRelations = relations(categories, ({ one, many }) => ({
  parent: one(categories, {
    fields: [categories.parentId],
    references: [categories.id],
    relationName: 'category_tree',
  }),
  children: many(categories, { relationName: 'category_tree' }),
  products: many(products),
}));

export const partBrandsRelations = relations(partBrands, ({ many }) => ({
  products: many(products),
}));

export const productsRelations = relations(products, ({ one, many }) => ({
  partBrand: one(partBrands, {
    fields: [products.partBrandId],
    references: [partBrands.id],
  }),
  category: one(categories, {
    fields: [products.categoryId],
    references: [categories.id],
  }),
  codes: many(productCodes),
  applications: many(productApplications),
  equivalences: many(productEquivalences, { relationName: 'product_equivalence_source' }),
  orderItems: many(orderItems),
  stockMovements: many(stockMovements),
}));

export const productCodesRelations = relations(productCodes, ({ one }) => ({
  product: one(products, {
    fields: [productCodes.productId],
    references: [products.id],
  }),
}));

export const productApplicationsRelations = relations(productApplications, ({ one }) => ({
  product: one(products, {
    fields: [productApplications.productId],
    references: [products.id],
  }),
  vehicleVersion: one(vehicleVersions, {
    fields: [productApplications.vehicleVersionId],
    references: [vehicleVersions.id],
  }),
}));

export const productEquivalencesRelations = relations(productEquivalences, ({ one }) => ({
  product: one(products, {
    fields: [productEquivalences.productId],
    references: [products.id],
    relationName: 'product_equivalence_source',
  }),
  equivalentProduct: one(products, {
    fields: [productEquivalences.equivalentProductId],
    references: [products.id],
    relationName: 'product_equivalence_target',
  }),
}));

export type CategoryRow = typeof categories.$inferSelect;
export type PartBrandRow = typeof partBrands.$inferSelect;
export type ProductRow = typeof products.$inferSelect;
export type NewProductRow = typeof products.$inferInsert;
export type ProductCodeRow = typeof productCodes.$inferSelect;
export type ProductApplicationRow = typeof productApplications.$inferSelect;
