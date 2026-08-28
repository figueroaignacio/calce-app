import { z } from 'zod';
import { idSchema } from '../common/primitives.js';

/** Terminal automotriz: Volkswagen, Ford, Renault, Chevrolet. */
export const vehicleBrandSchema = z.object({
  id: idSchema,
  name: z.string().min(1).max(80),
});
export type VehicleBrand = z.infer<typeof vehicleBrandSchema>;

export const createVehicleBrandSchema = vehicleBrandSchema.omit({ id: true });
export type CreateVehicleBrandInput = z.infer<typeof createVehicleBrandSchema>;
