import { z } from 'zod';
import { apiErrorSchema, type ApiError } from './api-error.js';

/**
 * Sobre de exito. El `TransformResponseInterceptor` de la API envuelve en esta
 * forma todo lo que devuelve un controller.
 */
export interface ApiSuccessResponse<TData> {
  success: true;
  data: TData;
  timestamp: string;
}

export function apiSuccessResponseSchema<TData extends z.ZodType>(dataSchema: TData) {
  return z.object({
    success: z.literal(true),
    data: dataSchema,
    timestamp: z.iso.datetime(),
  });
}

/** Toda respuesta de la API es un exito o un error, nunca otra cosa. */
export type ApiResponse<TData> = ApiSuccessResponse<TData> | ApiError;

export function apiResponseSchema<TData extends z.ZodType>(dataSchema: TData) {
  return z.union([apiSuccessResponseSchema(dataSchema), apiErrorSchema]);
}

/** Narrowing para consumir una respuesta sin recurrir a aserciones de tipo. */
export function isApiError<TData>(response: ApiResponse<TData>): response is ApiError {
  return response.success === false;
}
