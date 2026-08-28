import { z } from 'zod';
import { auditFieldsSchema, idSchema, modelYearSchema, moneySchema } from '../common/primitives.js';
import { paginationQuerySchema, sortOrderSchema } from '../common/pagination.js';
import { productCodeTypeSchema } from '../enums/product-code-type.js';

/**
 * Producto del catalogo.
 *
 * `embedding` no forma parte del contrato: es una columna interna que solo usa
 * la busqueda semantica del backend.
 */
export const productSchema = z
  .object({
    id: idSchema,
    sku: z.string().min(1).max(64),
    description: z.string().min(1).max(500),
    normalizedDescription: z.string().max(500).nullable(),
    partBrandId: idSchema.nullable(),
    categoryId: idSchema.nullable(),
    listPrice: moneySchema,
    minStock: z.number().int().nonnegative(),
    warehouseLocation: z.string().max(64).nullable(),
    isActive: z.boolean(),
  })
  .extend(auditFieldsSchema.shape);
export type Product = z.infer<typeof productSchema>;

/** Codigo alternativo por el que se puede encontrar el producto. */
export const productCodeSchema = z.object({
  id: idSchema,
  productId: idSchema,
  type: productCodeTypeSchema,
  code: z.string().min(1).max(64),
});
export type ProductCode = z.infer<typeof productCodeSchema>;

/**
 * Aplicacion vehicular: el corazon del dominio.
 *
 * Declara para que version de vehiculo y en que rango de anios sirve la pieza.
 * `yearTo` en null significa "hasta la actualidad".
 */
export const productApplicationSchema = z.object({
  id: idSchema,
  productId: idSchema,
  vehicleVersionId: idSchema,
  vehicleBrandName: z.string(),
  vehicleModelName: z.string(),
  vehicleVersionName: z.string(),
  engine: z.string().nullable(),
  yearFrom: modelYearSchema,
  yearTo: modelYearSchema.nullable(),
});
export type ProductApplication = z.infer<typeof productApplicationSchema>;

/**
 * Fila del listado de productos.
 *
 * `stock` viene derivado del libro de movimientos, no de una columna de
 * `products`. Ver la nota de diseno en @calce/db.
 */
export const productListItemSchema = productSchema.extend({
  partBrandName: z.string().nullable(),
  categoryName: z.string().nullable(),
  stock: z.number().int(),
});
export type ProductListItem = z.infer<typeof productListItemSchema>;

/** Producto con todo lo que hace falta para la ficha de detalle. */
export const productDetailSchema = productListItemSchema.extend({
  codes: z.array(productCodeSchema),
  applications: z.array(productApplicationSchema),
});
export type ProductDetail = z.infer<typeof productDetailSchema>;

export const productCodeInputSchema = z.object({
  type: productCodeTypeSchema,
  code: z.string().min(1).max(64),
});
export type ProductCodeInput = z.infer<typeof productCodeInputSchema>;

export const productApplicationInputSchema = z
  .object({
    vehicleVersionId: idSchema,
    yearFrom: modelYearSchema,
    yearTo: modelYearSchema.nullable().default(null),
  })
  .refine((value) => value.yearTo === null || value.yearTo >= value.yearFrom, {
    message: 'El anio final no puede ser anterior al inicial',
    path: ['yearTo'],
  });
export type ProductApplicationInput = z.infer<typeof productApplicationInputSchema>;

export const createProductSchema = z.object({
  sku: z.string().min(1).max(64),
  description: z.string().min(1).max(500),
  partBrandId: idSchema.nullable().default(null),
  categoryId: idSchema.nullable().default(null),
  listPrice: moneySchema,
  minStock: z.number().int().nonnegative().default(0),
  warehouseLocation: z.string().max(64).nullable().default(null),
  codes: z.array(productCodeInputSchema).default([]),
  applications: z.array(productApplicationInputSchema).default([]),
});
export type CreateProductInput = z.infer<typeof createProductSchema>;

export const updateProductSchema = createProductSchema
  .partial()
  .extend({ isActive: z.boolean().optional() });
export type UpdateProductInput = z.infer<typeof updateProductSchema>;

/** Columnas por las que el listado admite ordenarse. */
export const PRODUCT_SORT_FIELDS = [
  'sku',
  'description',
  'listPrice',
  'minStock',
  'createdAt',
  'updatedAt',
] as const;
export const productSortFieldSchema = z.enum(PRODUCT_SORT_FIELDS);
export type ProductSortField = z.infer<typeof productSortFieldSchema>;

export const queryProductsSchema = paginationQuerySchema.extend({
  /** Busqueda por SKU, descripcion o cualquiera de los codigos alternativos. */
  search: z.string().trim().max(120).optional(),
  categoryId: idSchema.optional(),
  partBrandId: idSchema.optional(),
  /** Filtra por compatibilidad con una version de vehiculo concreta. */
  vehicleVersionId: idSchema.optional(),
  isActive: z.stringbool().optional(),
  sortBy: productSortFieldSchema.default('createdAt'),
  sortOrder: sortOrderSchema.default('desc'),
});
export type QueryProductsInput = z.infer<typeof queryProductsSchema>;
