import { type DatabaseConnection } from '@calce/db';
import { Global, Inject, Module, type OnModuleDestroy } from '@nestjs/common';
import {
  DATABASE,
  DATABASE_CONNECTION,
  databaseConnectionProvider,
  databaseProvider,
} from './database.provider';

/**
 * Modulo global de base de datos.
 *
 * Expone el cliente Drizzle por inyeccion para que ningun repositorio tenga que
 * construir su propia conexion, y cierra el pool cuando la app se apaga.
 */
@Global()
@Module({
  providers: [databaseConnectionProvider, databaseProvider],
  exports: [DATABASE, DATABASE_CONNECTION],
})
export class DatabaseModule implements OnModuleDestroy {
  constructor(@Inject(DATABASE_CONNECTION) private readonly connection: DatabaseConnection) {}

  async onModuleDestroy(): Promise<void> {
    await this.connection.close();
  }
}
