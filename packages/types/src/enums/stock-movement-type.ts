import { z } from 'zod';

/**
 * Tipos de movimiento del libro de stock.
 *
 * INBOUND y OUTBOUND suman y restan existencias fisicas, ADJUSTMENT corrige
 * diferencias de inventario y RESERVATION compromete unidades sin moverlas.
 */
export const STOCK_MOVEMENT_TYPES = ['INBOUND', 'OUTBOUND', 'ADJUSTMENT', 'RESERVATION'] as const;

export const stockMovementTypeSchema = z.enum(STOCK_MOVEMENT_TYPES);

export type StockMovementType = z.infer<typeof stockMovementTypeSchema>;
