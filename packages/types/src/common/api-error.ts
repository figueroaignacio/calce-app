import { z } from 'zod';

/**
 * Codigos de error del dominio.
 *
 * El frontend decide que mostrar en base al codigo, no al mensaje: el mensaje
 * puede cambiar de redaccion sin romper el cliente.
 */
export const API_ERROR_CODES = [
  'VALIDATION_ERROR',
  'UNAUTHORIZED',
  'FORBIDDEN',
  'NOT_FOUND',
  'CONFLICT',
  'INSUFFICIENT_STOCK',
  'INTERNAL_ERROR',
] as const;

export const apiErrorCodeSchema = z.enum(API_ERROR_CODES);
export type ApiErrorCode = z.infer<typeof apiErrorCodeSchema>;

/** Detalle de un campo que no paso la validacion. */
export const fieldErrorSchema = z.object({
  path: z.string(),
  message: z.string(),
});
export type FieldError = z.infer<typeof fieldErrorSchema>;

/** Formato unico de error que devuelve la API ante cualquier fallo. */
export const apiErrorSchema = z.object({
  success: z.literal(false),
  error: z.object({
    code: apiErrorCodeSchema,
    message: z.string(),
    fields: z.array(fieldErrorSchema).optional(),
  }),
  statusCode: z.number().int(),
  path: z.string(),
  timestamp: z.iso.datetime(),
});
export type ApiError = z.infer<typeof apiErrorSchema>;
