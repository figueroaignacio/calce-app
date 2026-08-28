import { type UserRole } from '@calce/types';
import { SetMetadata, type CustomDecorator } from '@nestjs/common';

export const ROLES_KEY = 'calce:roles';

/**
 * Restringe una ruta a los roles indicados. Sin este decorador, cualquier
 * usuario autenticado puede acceder.
 */
export const Roles = (...roles: UserRole[]): CustomDecorator<string> =>
  SetMetadata(ROLES_KEY, roles);
