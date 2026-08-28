import { type AuthenticatedUser } from '@calce/types';
import { createParamDecorator, UnauthorizedException, type ExecutionContext } from '@nestjs/common';

interface RequestWithUser {
  user?: AuthenticatedUser;
}

/**
 * Inyecta el usuario que resolvio la estrategia JWT.
 *
 * Falla si la ruta es publica: pedir el usuario en una ruta sin guard es un
 * error de programacion, no una condicion esperable en runtime.
 */
export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AuthenticatedUser => {
    const request = context.switchToHttp().getRequest<RequestWithUser>();

    if (!request.user) {
      throw new UnauthorizedException(
        'La ruta pide el usuario actual pero no esta protegida por JwtAuthGuard',
      );
    }

    return request.user;
  },
);
