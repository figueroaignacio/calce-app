import { neonConfig, Pool } from '@neondatabase/serverless';
import { drizzle, type NeonDatabase } from 'drizzle-orm/neon-serverless';
import ws from 'ws';
import * as schema from './schema/index.js';

/**
 * Decision de driver: `drizzle-orm/neon-serverless` con `Pool` sobre WebSocket,
 * no `neon-http`.
 *
 * El driver HTTP de Neon abre una conexion por sentencia y por eso no soporta
 * transacciones. Los modulos de pedidos y stock las necesitan si o si: confirmar
 * un pedido implica leer el ultimo `resulting_stock` de cada producto, validar
 * que alcance y escribir los asientos nuevos, todo o nada. Con HTTP, dos
 * confirmaciones concurrentes sobre el mismo producto pueden leer el mismo
 * stock y dejarlo en negativo.
 *
 * El costo es tener que inyectar una implementacion de WebSocket, porque Node
 * no trae una compatible con el protocolo que espera Neon.
 */

export type Database = NeonDatabase<typeof schema>;

export interface DatabaseConnection {
  db: Database;
  pool: Pool;
  /** Cierra el pool. La API lo llama en `onModuleDestroy`. */
  close: () => Promise<void>;
}

export interface CreateDatabaseOptions {
  connectionString: string;
  /**
   * Endpoint de un proxy WebSocket de Neon para desarrollo local contra un
   * PostgreSQL comun, con ruta incluida (ej. `localhost:5433/v1`, ver
   * `docker-compose.yml`). Contra Neon se deja vacio.
   */
  wsProxy?: string | undefined;
  /** Habilita el log de SQL de Drizzle. */
  logger?: boolean;
}

function configureDriver(wsProxy: string | undefined): void {
  neonConfig.webSocketConstructor = ws;

  if (!wsProxy) {
    return;
  }

  // Contra un PostgreSQL local no hay TLS ni el endpoint de Neon, asi que hay
  // que apuntar el driver al proxy y desactivar el handshake cifrado. El valor
  // se usa tal cual: la ruta depende de la version del proxy.
  neonConfig.wsProxy = () => wsProxy;
  neonConfig.useSecureWebSocket = false;
  neonConfig.pipelineTLS = false;
  neonConfig.pipelineConnect = false;
}

/** Crea el pool de conexiones y el cliente Drizzle tipado con todo el esquema. */
export function createDatabaseConnection(options: CreateDatabaseOptions): DatabaseConnection {
  configureDriver(options.wsProxy);

  const pool = new Pool({ connectionString: options.connectionString });
  const db = drizzle(pool, { schema, logger: options.logger ?? false });

  return {
    db,
    pool,
    close: () => pool.end(),
  };
}
