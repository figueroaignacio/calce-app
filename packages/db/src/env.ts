import { config } from 'dotenv';
import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

/**
 * Carga el `.env` de la raiz del monorepo subiendo desde el directorio actual.
 *
 * Solo lo usan los scripts de linea de comandos del paquete (migraciones, seed,
 * drizzle-kit), que se ejecutan con el cwd en `packages/db`. La API valida su
 * propio entorno en `config/env.config.ts` y no pasa por aca.
 */
function loadRootEnv(): void {
  let current = process.cwd();

  for (;;) {
    const candidate = resolve(current, '.env');
    if (existsSync(candidate)) {
      config({ path: candidate, quiet: true });
      return;
    }

    const parent = dirname(current);
    if (parent === current) {
      return;
    }
    current = parent;
  }
}

export interface CliEnv {
  databaseUrl: string;
  wsProxy: string | undefined;
}

/** Lee y valida las variables que necesitan los scripts del paquete. */
export function readCliEnv(): CliEnv {
  loadRootEnv();

  const databaseUrl = process.env['DATABASE_URL'];
  if (!databaseUrl) {
    throw new Error(
      'Falta DATABASE_URL. Copia .env.example a .env en la raiz del monorepo y completala.',
    );
  }

  return {
    databaseUrl,
    wsProxy: process.env['NEON_WS_PROXY'],
  };
}
