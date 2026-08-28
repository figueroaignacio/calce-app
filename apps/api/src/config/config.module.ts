import { Global, Module } from '@nestjs/common';
import { ENV_CONFIG, bootstrapEnvConfig } from './env.config';

/**
 * Expone el entorno ya validado a toda la app.
 *
 * La factory corre durante la inicializacion de modulos, asi que una variable
 * faltante tumba el arranque antes de que se abra el puerto.
 */
@Global()
@Module({
  providers: [{ provide: ENV_CONFIG, useFactory: bootstrapEnvConfig }],
  exports: [ENV_CONFIG],
})
export class ConfigModule {}
