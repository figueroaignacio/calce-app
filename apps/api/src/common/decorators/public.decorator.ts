import { SetMetadata, type CustomDecorator } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'calce:is-public';

/**
 * Exceptua una ruta del `JwtAuthGuard`, que esta registrado globalmente.
 *
 * Se usa en login, registro, refresh y health. Todo lo demas exige token.
 */
export const Public = (): CustomDecorator<string> => SetMetadata(IS_PUBLIC_KEY, true);
