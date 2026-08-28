import { z } from 'zod';

/**
 * Validacion de las variables `VITE_`.
 *
 * Mismo criterio que en el backend: si falta algo, la app falla al cargar con
 * un mensaje claro en lugar de romper en la primera llamada a la API.
 */
const envSchema = z.object({
  VITE_API_URL: z.url('Tiene que ser una URL absoluta, por ejemplo http://localhost:3000/api'),
});

export type WebEnv = Readonly<z.infer<typeof envSchema>>;

function loadEnv(): WebEnv {
  const result = envSchema.safeParse(import.meta.env);

  if (!result.success) {
    const detail = result.error.issues
      .map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`)
      .join('\n');

    throw new Error(
      `Configuracion de entorno invalida:\n${detail}\n` +
        'Revisa el archivo .env de la raiz del monorepo (ver .env.example).',
    );
  }

  return Object.freeze(result.data);
}

export const env = loadEnv();
