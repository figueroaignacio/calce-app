import { z } from 'zod';
import { idSchema } from '../common/primitives.js';

/** Modelo de una terminal: Gol Trend, Ranger, Kangoo. */
export const vehicleModelSchema = z.object({
  id: idSchema,
  vehicleBrandId: idSchema,
  name: z.string().min(1).max(80),
});
export type VehicleModel = z.infer<typeof vehicleModelSchema>;

export const createVehicleModelSchema = vehicleModelSchema.omit({ id: true });
export type CreateVehicleModelInput = z.infer<typeof createVehicleModelSchema>;
