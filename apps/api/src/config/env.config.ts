import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { config as loadDotenv } from 'dotenv';
import { z } from 'zod';

/**
 * Validacion del entorno.
 *
 * Se ejecuta una sola vez, antes de que Nest levante el primer modulo. Si algo
 * requerido falta o esta mal, el proceso muere aca con el detalle de que
 * variable fallo. La alternativa -arrancar igual y explotar en la primera
 * request- deja el problema escondido hasta produccion.
 */

const SECRET_MIN_LENGTH = 32;

/** Formato aceptado por `@nestjs/jwt`: `15m`, `7d`, `3600s`. */
const durationSchema = z
  .string()
  .regex(/^\d+[smhd]$/, 'Usa el formato <numero><s|m|h|d>, por ejemplo 15m o 7d');

const REQUIRED = 'Es obligatoria y no esta definida';

const envSchema = z.object({
  DATABASE_URL: z.string({ error: REQUIRED }).min(1, 'Es la cadena de conexion de Neon'),
  /** Solo para desarrollo local contra el proxy WebSocket (docker-compose). */
  NEON_WS_PROXY: z.string().min(1).optional(),

  PORT: z.coerce.number().int().positive().max(65535).default(3000),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  /** Lista separada por comas de origenes habilitados para CORS. */
  CORS_ORIGIN: z.string().default('http://localhost:5173'),

  JWT_SECRET: z
    .string({ error: REQUIRED })
    .min(SECRET_MIN_LENGTH, `Necesita al menos ${SECRET_MIN_LENGTH} caracteres`),
  JWT_EXPIRES_IN: durationSchema.default('15m'),
  REFRESH_TOKEN_SECRET: z
    .string({ error: REQUIRED })
    .min(SECRET_MIN_LENGTH, `Necesita al menos ${SECRET_MIN_LENGTH} caracteres`),
  REFRESH_TOKEN_EXPIRES_IN: durationSchema.default('7d'),

  AI_PROVIDER: z.enum(['google', 'openai']).default('google'),
  /**
   * Las credenciales de IA son opcionales al arrancar: sin ellas la app
   * funciona completa salvo el modulo `ai`, que devuelve un error explicito
   * cuando se lo invoca. Exigirlas en el arranque obligaria a tener una API key
   * para poder trabajar en el catalogo o en pedidos.
   */
  GOOGLE_GENERATIVE_AI_API_KEY: z.string().min(1).optional(),
  OPENAI_API_KEY: z.string().min(1).optional(),
  AI_MODEL: z.string().min(1).default('gemini-2.5-flash'),
  AI_EMBEDDING_MODEL: z.string().min(1).default('text-embedding-004'),
});

export type EnvConfig = Readonly<z.infer<typeof envSchema>>;

/** Token de inyeccion del entorno validado. */
export const ENV_CONFIG = Symbol('ENV_CONFIG');

/** Sube desde el cwd hasta encontrar el `.env` de la raiz del monorepo. */
function loadRootDotenv(): void {
  let current = process.cwd();

  for (;;) {
    const candidate = resolve(current, '.env');
    if (existsSync(candidate)) {
      loadDotenv({ path: candidate, quiet: true });
      return;
    }

    const parent = dirname(current);
    if (parent === current) {
      return;
    }
    current = parent;
  }
}

/**
 * Una variable declarada vacia en el `.env` vale lo mismo que no declararla.
 *
 * Sin esto, copiar `.env.example` tal cual haria fallar el arranque por cada
 * clave opcional que quedo sin completar, que es exactamente el caso normal.
 */
function treatEmptyAsMissing(source: NodeJS.ProcessEnv): Record<string, string | undefined> {
  return Object.fromEntries(
    Object.entries(source).map(([key, value]) => [
      key,
      value !== undefined && value.trim() === '' ? undefined : value,
    ]),
  );
}

function formatIssues(error: z.ZodError): string {
  return error.issues
    .map((issue) => `  - ${issue.path.join('.') || '(raiz)'}: ${issue.message}`)
    .join('\n');
}

/**
 * Lee y valida el entorno. Lanza con el detalle de cada variable rota.
 */
export function loadEnvConfig(source: NodeJS.ProcessEnv = process.env): EnvConfig {
  const result = envSchema.safeParse(treatEmptyAsMissing(source));

  if (!result.success) {
    throw new Error(
      `Configuracion de entorno invalida:\n${formatIssues(result.error)}\n` +
        'Revisa el archivo .env de la raiz del monorepo (ver .env.example).',
    );
  }

  return Object.freeze(result.data);
}

/** Carga el `.env` de la raiz y devuelve el entorno validado. */
export function bootstrapEnvConfig(): EnvConfig {
  loadRootDotenv();
  return loadEnvConfig();
}

/** Origenes habilitados para CORS, ya partidos y limpios. */
export function parseCorsOrigins(config: EnvConfig): string[] {
  return config.CORS_ORIGIN.split(',')
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0);
}
