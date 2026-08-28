import { z } from 'zod';
import { idSchema } from '../common/primitives.js';

/**
 * Version concreta de un modelo. Es el nivel al que se ata la compatibilidad:
 * un filtro de aceite puede servir para el 1.6 y no para el 1.4 del mismo auto.
 */
export const vehicleVersionSchema = z.object({
  id: idSchema,
  vehicleModelId: idSchema,
  name: z.string().min(1).max(120),
  engine: z.string().max(80).nullable(),
});
export type VehicleVersion = z.infer<typeof vehicleVersionSchema>;

export const createVehicleVersionSchema = vehicleVersionSchema.omit({ id: true });
export type CreateVehicleVersionInput = z.infer<typeof createVehicleVersionSchema>;
