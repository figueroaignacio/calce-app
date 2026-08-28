import { z } from 'zod';
import { idSchema } from '../common/primitives.js';
import { userSchema } from '../entities/user.js';
import { userRoleSchema } from '../enums/user-role.js';

/** Par de tokens que devuelve el backend al autenticar. */
export const authTokensSchema = z.object({
  accessToken: z.string().min(1),
  refreshToken: z.string().min(1),
  /** Vida util del access token en segundos. */
  expiresIn: z.number().int().positive(),
});
export type AuthTokens = z.infer<typeof authTokensSchema>;

/** Respuesta de login, registro y refresh. */
export const authSessionSchema = z.object({
  user: userSchema,
  tokens: authTokensSchema,
});
export type AuthSession = z.infer<typeof authSessionSchema>;

/**
 * Contenido del access token.
 *
 * `sub` es el id del usuario. El rol viaja en el token para que `RolesGuard`
 * resuelva la autorizacion sin ir a la base en cada request.
 */
export const jwtPayloadSchema = z.object({
  sub: idSchema,
  email: z.email(),
  role: userRoleSchema,
});
export type JwtPayload = z.infer<typeof jwtPayloadSchema>;

/** Usuario autenticado tal como lo inyecta el decorador `@CurrentUser()`. */
export const authenticatedUserSchema = jwtPayloadSchema.extend({
  id: idSchema,
});
export type AuthenticatedUser = z.infer<typeof authenticatedUserSchema>;
