import {
  authSessionSchema,
  userSchema,
  type AuthSession,
  type AuthenticatedUser,
  type User,
} from '@calce/types';
import { Body, Controller, Get, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser, Public } from '@/common/decorators';
import { ZodValidationPipe } from '@/common/pipes';
import { ApiZodBody, ApiZodErrorResponse, ApiZodResponse } from '@/common/swagger';
import { AuthService } from './auth.service';
import { loginDtoSchema, type LoginDto } from './dto/login.dto';
import { refreshTokenDtoSchema, type RefreshTokenDto } from './dto/refresh-token.dto';
import { registerDtoSchema, type RegisterDto } from './dto/register.dto';

/**
 * Rutas de autenticacion. Solo traduce HTTP a llamadas del service: aca no hay
 * ninguna decision de negocio.
 */
@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Crea un usuario y devuelve una sesion' })
  @ApiZodBody(registerDtoSchema)
  @ApiZodResponse(HttpStatus.CREATED, authSessionSchema, 'Usuario creado')
  @ApiZodErrorResponse(HttpStatus.CONFLICT, 'Ya existe un usuario con ese correo')
  register(@Body(new ZodValidationPipe(registerDtoSchema)) dto: RegisterDto): Promise<AuthSession> {
    return this.authService.register(dto);
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Valida credenciales y devuelve el par de tokens' })
  @ApiZodBody(loginDtoSchema)
  @ApiZodResponse(HttpStatus.OK, authSessionSchema, 'Sesion iniciada')
  @ApiZodErrorResponse(HttpStatus.UNAUTHORIZED, 'Credenciales invalidas')
  login(@Body(new ZodValidationPipe(loginDtoSchema)) dto: LoginDto): Promise<AuthSession> {
    return this.authService.login(dto);
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Renueva el par de tokens a partir del refresh token' })
  @ApiZodBody(refreshTokenDtoSchema)
  @ApiZodResponse(HttpStatus.OK, authSessionSchema, 'Tokens renovados')
  @ApiZodErrorResponse(HttpStatus.UNAUTHORIZED, 'Refresh token invalido o vencido')
  refresh(
    @Body(new ZodValidationPipe(refreshTokenDtoSchema)) dto: RefreshTokenDto,
  ): Promise<AuthSession> {
    return this.authService.refresh(dto);
  }

  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Devuelve el usuario del token actual' })
  @ApiZodResponse(HttpStatus.OK, userSchema, 'Usuario autenticado')
  @ApiZodErrorResponse(HttpStatus.UNAUTHORIZED, 'Falta el token o esta vencido')
  me(@CurrentUser() user: AuthenticatedUser): Promise<User> {
    return this.authService.getProfile(user.id);
  }
}
