import { relations } from 'drizzle-orm';
import { index, pgTable, uniqueIndex, uuid, varchar } from 'drizzle-orm/pg-core';
import { productApplications } from './products.js';

/**
 * Arbol de compatibilidad vehicular: marca -> modelo -> version.
 *
 * La aplicacion de un repuesto se ata a la version, no al modelo, porque dos
 * versiones del mismo auto pueden llevar piezas distintas.
 */
export const vehicleBrands = pgTable(
  'vehicle_brands',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: varchar('name', { length: 80 }).notNull(),
  },
  (table) => [uniqueIndex('vehicle_brands_name_key').on(table.name)],
);

export const vehicleModels = pgTable(
  'vehicle_models',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    vehicleBrandId: uuid('vehicle_brand_id')
      .notNull()
      .references(() => vehicleBrands.id, { onDelete: 'restrict' }),
    name: varchar('name', { length: 80 }).notNull(),
  },
  (table) => [
    uniqueIndex('vehicle_models_brand_name_key').on(table.vehicleBrandId, table.name),
    index('vehicle_models_brand_idx').on(table.vehicleBrandId),
  ],
);

export const vehicleVersions = pgTable(
  'vehicle_versions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    vehicleModelId: uuid('vehicle_model_id')
      .notNull()
      .references(() => vehicleModels.id, { onDelete: 'restrict' }),
    name: varchar('name', { length: 120 }).notNull(),
    /** Motorizacion tal como la nombra la terminal: "1.6 16v", "2.0 TDCi". */
    engine: varchar('engine', { length: 80 }),
  },
  (table) => [
    uniqueIndex('vehicle_versions_model_name_key').on(table.vehicleModelId, table.name),
    index('vehicle_versions_model_idx').on(table.vehicleModelId),
  ],
);

export const vehicleBrandsRelations = relations(vehicleBrands, ({ many }) => ({
  models: many(vehicleModels),
}));

export const vehicleModelsRelations = relations(vehicleModels, ({ one, many }) => ({
  brand: one(vehicleBrands, {
    fields: [vehicleModels.vehicleBrandId],
    references: [vehicleBrands.id],
  }),
  versions: many(vehicleVersions),
}));

export const vehicleVersionsRelations = relations(vehicleVersions, ({ one, many }) => ({
  model: one(vehicleModels, {
    fields: [vehicleVersions.vehicleModelId],
    references: [vehicleModels.id],
  }),
  applications: many(productApplications),
}));

export type VehicleBrandRow = typeof vehicleBrands.$inferSelect;
export type VehicleModelRow = typeof vehicleModels.$inferSelect;
export type VehicleVersionRow = typeof vehicleVersions.$inferSelect;
