import { z } from 'zod';
import { passwordSchema } from '../entities/user.js';
import { userRoleSchema } from '../enums/user-role.js';

export const loginSchema = z.object({
  email: z.email('Ingresa un correo valido'),
  password: z.string().min(1, 'La contrasena es obligatoria'),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const registerSchema = z.object({
  email: z.email('Ingresa un correo valido'),
  name: z.string().min(1, 'El nombre es obligatorio').max(120),
  password: passwordSchema,
  role: userRoleSchema.default('SELLER'),
});
export type RegisterInput = z.infer<typeof registerSchema>;

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1),
});
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;
