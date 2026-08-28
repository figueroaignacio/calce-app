import { z } from 'zod';

/**
 * Origen de un codigo de producto.
 *
 * Un mismo repuesto convive con el codigo de la terminal automotriz (OEM), el
 * del fabricante de la pieza y el interno de la distribuidora. La busqueda
 * tiene que resolver los tres.
 */
export const PRODUCT_CODE_TYPES = ['OEM', 'MANUFACTURER', 'INTERNAL'] as const;

export const productCodeTypeSchema = z.enum(PRODUCT_CODE_TYPES);

export type ProductCodeType = z.infer<typeof productCodeTypeSchema>;
