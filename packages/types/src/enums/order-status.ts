import { z } from 'zod';

/**
 * Ciclo de vida de un pedido.
 *
 * DRAFT es el unico estado editable libremente. CONFIRMED dispara la reserva
 * de stock; SHIPPED descuenta definitivamente; CANCELLED libera lo reservado.
 */
export const ORDER_STATUSES = [
  'DRAFT',
  'CONFIRMED',
  'IN_PREPARATION',
  'SHIPPED',
  'DELIVERED',
  'CANCELLED',
] as const;

export const orderStatusSchema = z.enum(ORDER_STATUSES);

export type OrderStatus = z.infer<typeof orderStatusSchema>;
