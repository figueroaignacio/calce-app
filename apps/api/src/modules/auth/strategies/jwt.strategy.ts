import { type AuthenticatedUser, jwtPayloadSchema } from '@calce/types';
import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ENV_CONFIG, type EnvConfig } from '@/config/env.config';

/**
 * Estrategia de acceso por bearer token.
 *
 * El payload se valida con el mismo esquema Zod que lo definio al firmarlo: un
 * token con forma inesperada se rechaza en lugar de propagarse sin tipar.
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(@Inject(ENV_CONFIG) config: EnvConfig) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.JWT_SECRET,
    });
  }

  validate(payload: unknown): AuthenticatedUser {
    const result = jwtPayloadSchema.safeParse(payload);

    if (!result.success) {
      throw new UnauthorizedException({
        code: 'UNAUTHORIZED',
        message: 'El token no tiene el formato esperado',
      });
    }

    return { ...result.data, id: result.data.sub };
  }
}
