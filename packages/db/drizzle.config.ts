import { config } from 'dotenv';
import { defineConfig } from 'drizzle-kit';

// drizzle-kit corre siempre con el cwd en `packages/db`.
config({ path: '../../.env', quiet: true });

const databaseUrl = process.env['DATABASE_URL'];

if (!databaseUrl) {
  throw new Error(
    'Falta DATABASE_URL. Copia .env.example a .env en la raiz del monorepo y completala.',
  );
}

export default defineConfig({
  dialect: 'postgresql',
  schema: './src/schema/index.ts',
  out: './drizzle',
  dbCredentials: { url: databaseUrl },
  verbose: true,
  strict: true,
});
