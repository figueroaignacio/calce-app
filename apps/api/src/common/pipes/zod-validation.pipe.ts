import { BadRequestException, Injectable, type PipeTransform } from '@nestjs/common';
import { type FieldError } from '@calce/types';
import { type z } from 'zod';

/**
 * Valida el payload contra un esquema de @calce/types y devuelve el valor ya
 * parseado, con defaults aplicados y tipos coercionados.
 *
 * Es el unico punto donde entra data sin tipar al backend: de aca para adentro
 * los services trabajan con tipos inferidos del contrato.
 */
@Injectable()
export class ZodValidationPipe<TSchema extends z.ZodType> implements PipeTransform {
  constructor(private readonly schema: TSchema) {}

  transform(value: unknown): z.output<TSchema> {
    const result = this.schema.safeParse(value);

    if (!result.success) {
      const fields: FieldError[] = result.error.issues.map((issue) => ({
        path: issue.path.join('.'),
        message: issue.message,
      }));

      throw new BadRequestException({
        code: 'VALIDATION_ERROR',
        message: 'La solicitud no cumple el contrato esperado',
        fields,
      });
    }

    return result.data;
  }
}
