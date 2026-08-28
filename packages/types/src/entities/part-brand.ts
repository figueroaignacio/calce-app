import { z } from 'zod';
import { idSchema } from '../common/primitives.js';

/** Fabricante de la pieza: Fram, Bosch, Ferodo, Monroe. No confundir con la
 * terminal automotriz, que se modela en `vehicle-brand`. */
export const partBrandSchema = z.object({
  id: idSchema,
  name: z.string().min(1).max(120),
});
export type PartBrand = z.infer<typeof partBrandSchema>;

export const createPartBrandSchema = partBrandSchema.omit({ id: true });
export type CreatePartBrandInput = z.infer<typeof createPartBrandSchema>;
