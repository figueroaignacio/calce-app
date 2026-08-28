import { apiErrorSchema, apiSuccessResponseSchema } from '@calce/types';
import { applyDecorators } from '@nestjs/common';
import { ApiBody, ApiQuery, ApiResponse, type SchemaObject } from '@nestjs/swagger';
import { z } from 'zod';

/**
 * Puente entre los contratos Zod y la documentacion OpenAPI.
 *
 * Zod 4 sabe convertir un esquema a JSON Schema, asi que Swagger se genera
 * desde el mismo contrato que valida el request. Sin esto habria que repetir
 * cada campo con `@ApiProperty`, y las dos definiciones se irian separando.
 */

/**
 * `io: 'input'` describe lo que el cliente manda (antes de defaults y
 * coerciones); `'output'` describe lo que la API devuelve.
 */
export function zodToOpenApiSchema(
  schema: z.ZodType,
  io: 'input' | 'output' = 'output',
): SchemaObject {
  // El conversor devuelve JSON Schema plano; OpenAPI 3.0 acepta ese subconjunto.
  return z.toJSONSchema(schema, {
    target: 'openapi-3.0',
    io,
    unrepresentable: 'any',
  }) as SchemaObject;
}

/** Documenta el body de una ruta a partir de su esquema de validacion. */
export function ApiZodBody(schema: z.ZodType): MethodDecorator {
  return ApiBody({ schema: zodToOpenApiSchema(schema, 'input') });
}

/**
 * Documenta los query params abriendo el objeto en un parametro por propiedad,
 * que es como los espera OpenAPI.
 */
export function ApiZodQuery(schema: z.ZodObject): MethodDecorator {
  const document = zodToOpenApiSchema(schema, 'input');
  const properties = document.properties ?? {};
  const required = new Set(document.required ?? []);

  const decorators = Object.entries(properties).map(([name, property]) =>
    ApiQuery({
      name,
      required: required.has(name),
      schema: property as SchemaObject,
    }),
  );

  return applyDecorators(...decorators);
}

/** Documenta una respuesta exitosa, ya envuelta en el sobre de la API. */
export function ApiZodResponse(
  status: number,
  dataSchema: z.ZodType,
  description: string,
): MethodDecorator {
  return ApiResponse({
    status,
    description,
    schema: zodToOpenApiSchema(apiSuccessResponseSchema(dataSchema)),
  });
}

/** Documenta una respuesta de error con el formato unico de la API. */
export function ApiZodErrorResponse(status: number, description: string): MethodDecorator {
  return ApiResponse({
    status,
    description,
    schema: zodToOpenApiSchema(apiErrorSchema),
  });
}
