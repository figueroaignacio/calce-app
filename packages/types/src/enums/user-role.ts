import { z } from 'zod';

/** Roles del sistema. Determinan que rutas puede consumir un usuario. */
export const USER_ROLES = ['ADMIN', 'SELLER', 'WAREHOUSE'] as const;

export const userRoleSchema = z.enum(USER_ROLES);

export type UserRole = z.infer<typeof userRoleSchema>;
