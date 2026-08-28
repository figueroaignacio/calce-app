import { z } from 'zod';

/** Prompt corto para comprobar que el proveedor responde. */
export const pingAiDtoSchema = z.object({
  prompt: z.string().trim().min(1).max(500).default('Respondé unicamente con la palabra: listo'),
});

export type PingAiDto = z.infer<typeof pingAiDtoSchema>;

export const pingAiResultSchema = z.object({
  provider: z.enum(['google', 'openai']),
  model: z.string(),
  text: z.string(),
  latencyMs: z.number().int().nonnegative(),
});

export type PingAiResult = z.infer<typeof pingAiResultSchema>;
