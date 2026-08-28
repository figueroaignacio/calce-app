import { z } from 'zod';
import { idSchema } from '../common/primitives.js';

/** Rubro del catalogo. Admite un nivel padre para armar el arbol de familias. */
export const categorySchema = z.object({
  id: idSchema,
  name: z.string().min(1).max(120),
  parentId: idSchema.nullable(),
});
export type Category = z.infer<typeof categorySchema>;

export const createCategorySchema = categorySchema.omit({ id: true });
export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
