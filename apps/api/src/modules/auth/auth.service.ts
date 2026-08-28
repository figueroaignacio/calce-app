import { type AuthSession, type AuthTokens, type JwtPayload, type User } from '@calce/types';
import { ConflictException, Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { ENV_CONFIG, type EnvConfig } from '@/config/env.config';
import { AuthRepository } from './auth.repository';
import { type LoginDto } from './dto/login.dto';
import { type RefreshTokenDto } from './dto/refresh-token.dto';
import { type RegisterDto } from './dto/register.dto';

const SECONDS_PER_UNIT: Record<string, number> = { s: 1, m: 60, h: 3600, d: 86400 };

/** Convierte `15m` o `7d` a segundos. El formato ya lo valido `env.config`. */
function durationToSeconds(duration: string): number {
  const amount = Number.parseInt(duration.slice(0, -1), 10);
  const unit = duration.slice(-1);
  return amount * (SECONDS_PER_UNIT[unit] ?? 1);
}

/**
 * Logica de autenticacion. No conoce HTTP ni Drizzle: recibe DTO ya validados y
 * delega la persistencia en `AuthRepository`.
 */
@Injectable()
export class AuthService {
  constructor(
    private readonly repository: AuthRepository,
    private readonly jwtService: JwtService,
    @Inject(ENV_CONFIG) private readonly config: EnvConfig,
  ) {}

  async register(dto: RegisterDto): Promise<AuthSession> {
    if (await this.repository.existsByEmail(dto.email)) {
      throw new ConflictException({
        code: 'CONFLICT',
        message: 'Ya existe un usuario con ese correo',
      });
    }

    const user = await this.repository.create({
      email: dto.email,
      name: dto.name,
      role: dto.role,
      passwordHash: await this.hashPassword(dto.password),
    });

    return { user, tokens: await this.issueTokens(user) };
  }

  async login(dto: LoginDto): Promise<AuthSession> {
    const found = await this.repository.findByEmail(dto.email);

    // Se verifica el hash incluso cuando el usuario no existe, para que el
    // tiempo de respuesta no delate que correos estan registrados.
    const passwordMatches = found
      ? await argon2.verify(found.passwordHash, dto.password)
      : await this.burnTime(dto.password);

    if (!found || !passwordMatches) {
      throw new UnauthorizedException({
        code: 'UNAUTHORIZED',
        message: 'Correo o contrasena incorrectos',
      });
    }

    if (!found.isActive) {
      throw new UnauthorizedException({
        code: 'UNAUTHORIZED',
        message: 'La cuenta esta desactivada',
      });
    }

    const { passwordHash: _passwordHash, ...user } = found;
    return { user, tokens: await this.issueTokens(user) };
  }

  /**
   * Renueva el par de tokens.
   *
   * TODO: rotar y revocar. Hoy un refresh token robado sirve hasta que expira;
   * hace falta persistir el jti emitido por usuario e invalidarlo al usarlo.
   */
  async refresh(dto: RefreshTokenDto): Promise<AuthSession> {
    let payload: JwtPayload;

    try {
      payload = await this.jwtService.verifyAsync<JwtPayload>(dto.refreshToken, {
        secret: this.config.REFRESH_TOKEN_SECRET,
      });
    } catch {
      throw new UnauthorizedException({
        code: 'UNAUTHORIZED',
        message: 'El refresh token es invalido o expiro',
      });
    }

    const user = await this.repository.findById(payload.sub);

    if (!user || !user.isActive) {
      throw new UnauthorizedException({
        code: 'UNAUTHORIZED',
        message: 'El usuario del token ya no esta habilitado',
      });
    }

    return { user, tokens: await this.issueTokens(user) };
  }

  /** Perfil del usuario del token, releido de la base para no confiar en el JWT. */
  async getProfile(userId: string): Promise<User> {
    const user = await this.repository.findById(userId);

    if (!user) {
      throw new UnauthorizedException({
        code: 'UNAUTHORIZED',
        message: 'El usuario del token ya no existe',
      });
    }

    return user;
  }

  private hashPassword(password: string): Promise<string> {
    return argon2.hash(password, { type: argon2.argon2id });
  }

  /** Consume tiempo comparable al de una verificacion real. */
  private async burnTime(password: string): Promise<boolean> {
    await this.hashPassword(password);
    return false;
  }

  private async issueTokens(user: User): Promise<AuthTokens> {
    const payload: JwtPayload = { sub: user.id, email: user.email, role: user.role };
    // Se firma con la duracion ya resuelta a segundos: `jsonwebtoken` acepta el
    // numero directo y asi no hay dos formatos de duracion dando vueltas.
    const accessTtl = durationToSeconds(this.config.JWT_EXPIRES_IN);
    const refreshTtl = durationToSeconds(this.config.REFRESH_TOKEN_EXPIRES_IN);

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.config.JWT_SECRET,
        expiresIn: accessTtl,
      }),
      this.jwtService.signAsync(payload, {
        secret: this.config.REFRESH_TOKEN_SECRET,
        expiresIn: refreshTtl,
      }),
    ]);

    return {
      accessToken,
      refreshToken,
      expiresIn: accessTtl,
    };
  }
}
