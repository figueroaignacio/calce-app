import { type User } from '@calce/types';
import { ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { type EnvConfig } from '@/config/env.config';
import { AuthRepository, type CreateUserRecord } from './auth.repository';
import { AuthService } from './auth.service';
import { type RegisterDto } from './dto/register.dto';

describe('AuthService - Registro de usuarios', () => {
  const user: User = {
    id: '550e8400-e29b-41d4-a716-446655440000',
    email: 'santiago@calce.com',
    name: 'Santiago',
    role: 'SELLER',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const repository = {
    existsByEmail: jest.fn(async (_email: string): Promise<boolean> => false),
    create: jest.fn(async (_record: CreateUserRecord): Promise<User> => user),
  };

  const jwtService = {
    signAsync: jest.fn(async (): Promise<string> => 'token-de-prueba'),
  };

  const config = {
    JWT_SECRET: 'clave-de-prueba-con-mas-de-32-caracteres',
    REFRESH_TOKEN_SECRET: 'otra-clave-de-prueba-con-mas-de-32-caracteres',
    JWT_EXPIRES_IN: '15m',
    REFRESH_TOKEN_EXPIRES_IN: '7d',
  } as EnvConfig;

  const registerDto: RegisterDto = {
    email: 'santiago@calce.com',
    name: 'Santiago',
    password: 'ClaveSegura123!',
  };

  let service: AuthService;

  beforeEach(() => {
    jest.clearAllMocks();

    repository.existsByEmail.mockResolvedValue(false);
    repository.create.mockResolvedValue(user);
    jwtService.signAsync.mockResolvedValue('token-de-prueba');

    service = new AuthService(
      repository as unknown as AuthRepository,
      jwtService as unknown as JwtService,
      config,
    );
  });

  it('registra un usuario con el rol SELLER', async () => {
    const result = await service.register(registerDto);

    expect(repository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        email: registerDto.email,
        name: registerDto.name,
        role: 'SELLER',
      }),
    );

    expect(result.user.role).toBe('SELLER');
    expect(result.tokens.accessToken).toBeDefined();
    expect(result.tokens.refreshToken).toBeDefined();
  });

  it('impide asignarse el rol ADMIN durante el registro', async () => {
    const maliciousDto = {
      ...registerDto,
      role: 'ADMIN',
    } as RegisterDto;

    await service.register(maliciousDto);

    expect(repository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        role: 'SELLER',
      }),
    );

    expect(repository.create).not.toHaveBeenCalledWith(
      expect.objectContaining({
        role: 'ADMIN',
      }),
    );
  });

  it('almacena un hash y no la contrasena original', async () => {
    await service.register(registerDto);

    const record = repository.create.mock.calls[0]?.[0];

    expect(record).toBeDefined();
    expect(record?.passwordHash).not.toBe(registerDto.password);
    expect(record?.passwordHash).toMatch(/^\$argon2id\$/);
  });

  it('rechaza un correo electronico duplicado', async () => {
    repository.existsByEmail.mockResolvedValue(true);

    await expect(service.register(registerDto)).rejects.toBeInstanceOf(ConflictException);

    expect(repository.create).not.toHaveBeenCalled();
  });
});
