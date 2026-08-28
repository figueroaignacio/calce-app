import { createDatabaseConnection, type Database, type DatabaseConnection } from '@calce/db';
import { type Provider } from '@nestjs/common';
import { ENV_CONFIG, type EnvConfig } from '@/config/env.config';

/** Cliente Drizzle listo para consultar. Es lo que inyectan los repositorios. */
export const DATABASE = Symbol('DATABASE');

/** Conexion completa, incluido el pool. Solo la usa el modulo para cerrarla. */
export const DATABASE_CONNECTION = Symbol('DATABASE_CONNECTION');

export const databaseConnectionProvider: Provider = {
  provide: DATABASE_CONNECTION,
  inject: [ENV_CONFIG],
  useFactory: (config: EnvConfig): DatabaseConnection =>
    createDatabaseConnection({
      connectionString: config.DATABASE_URL,
      wsProxy: config.NEON_WS_PROXY,
      logger: config.NODE_ENV === 'development',
    }),
};

export const databaseProvider: Provider = {
  provide: DATABASE,
  inject: [DATABASE_CONNECTION],
  useFactory: (connection: DatabaseConnection): Database => connection.db,
};
