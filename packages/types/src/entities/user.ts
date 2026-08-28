import { z } from 'zod';
import { auditFieldsSchema, idSchema } from '../common/primitives.js';
import { userRoleSchema } from '../enums/user-role.js';

/**
 * Usuario del sistema tal como lo expone la API.
 *
 * El hash de contrasena vive solo en la base y nunca cruza este contrato.
 */
export const userSchema = z
  .object({
    id: idSchema,
    email: z.email(),
    name: z.string().min(1).max(120),
    role: userRoleSchema,
    isActive: z.boolean(),
  })
  .extend(auditFieldsSchema.shape);
export type User = z.infer<typeof userSchema>;

export const passwordSchema = z
  .string()
  .min(8, 'La contrasena debe tener al menos 8 caracteres')
  .max(128);

export const createUserSchema = z.object({
  email: z.email(),
  name: z.string().min(1).max(120),
  password: passwordSchema,
  role: userRoleSchema.default('SELLER'),
});
export type CreateUserInput = z.infer<typeof createUserSchema>;

export const updateUserSchema = createUserSchema
  .omit({ password: true })
  .partial()
  .extend({ isActive: z.boolean().optional() });
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
