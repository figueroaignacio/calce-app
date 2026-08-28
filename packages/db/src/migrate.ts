import { migrate } from 'drizzle-orm/neon-serverless/migrator';
import { dirname, resolve } from 'node:path';
import { createDatabaseConnection } from './client.js';
import { readCliEnv } from './env.js';

/** Aplica las migraciones pendientes de `drizzle/` contra la base configurada. */
async function main(): Promise<void> {
  const env = readCliEnv();
  const connection = createDatabaseConnection({
    connectionString: env.databaseUrl,
    wsProxy: env.wsProxy,
  });

  const migrationsFolder = resolve(dirname(__dirname), 'drizzle');

  try {
    console.warn(`Aplicando migraciones desde ${migrationsFolder}`);
    await migrate(connection.db, { migrationsFolder });
    console.warn('Migraciones aplicadas.');
  } finally {
    await connection.close();
  }
}

main().catch((error: unknown) => {
  console.error('La migracion fallo:', error);
  process.exitCode = 1;
});
