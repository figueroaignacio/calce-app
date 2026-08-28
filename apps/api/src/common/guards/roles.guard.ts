import { type AuthenticatedUser, type UserRole } from '@calce/types';
import {
  ForbiddenException,
  Injectable,
  type CanActivate,
  type ExecutionContext,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '@/common/decorators/roles.decorator';

interface RequestWithUser {
  user?: AuthenticatedUser;
}

/**
 * Autorizacion por rol. Corre despues de `JwtAuthGuard`, asi que puede asumir
 * que el usuario ya esta resuelto cuando hay roles declarados.
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<UserRole[] | undefined>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!required || required.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const user = request.user;

    if (!user || !required.includes(user.role)) {
      throw new ForbiddenException({
        code: 'FORBIDDEN',
        message: `Esta operacion requiere uno de estos roles: ${required.join(', ')}`,
      });
    }

    return true;
  }
}
