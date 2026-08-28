import { type ApiError, type ApiErrorCode, type FieldError } from '@calce/types';
import {
  Catch,
  HttpException,
  HttpStatus,
  Logger,
  type ArgumentsHost,
  type ExceptionFilter,
} from '@nestjs/common';
import { type Request, type Response } from 'express';

interface StructuredErrorBody {
  code?: unknown;
  message?: unknown;
  fields?: unknown;
}

const STATUS_TO_CODE: Partial<Record<number, ApiErrorCode>> = {
  [HttpStatus.BAD_REQUEST]: 'VALIDATION_ERROR',
  [HttpStatus.UNAUTHORIZED]: 'UNAUTHORIZED',
  [HttpStatus.FORBIDDEN]: 'FORBIDDEN',
  [HttpStatus.NOT_FOUND]: 'NOT_FOUND',
  [HttpStatus.CONFLICT]: 'CONFLICT',
  [HttpStatus.UNPROCESSABLE_ENTITY]: 'VALIDATION_ERROR',
};

function isStructuredBody(value: unknown): value is StructuredErrorBody {
  return typeof value === 'object' && value !== null;
}

function isFieldError(value: unknown): value is FieldError {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  return typeof candidate.path === 'string' && typeof candidate.message === 'string';
}

function toFieldErrors(value: unknown): FieldError[] | undefined {
  if (!Array.isArray(value)) {
    return undefined;
  }

  const fields = value.filter(isFieldError);
  return fields.length > 0 ? fields : undefined;
}

/**
 * Filtro global de excepciones.
 *
 * Toda respuesta de error de la API sale con la forma de `ApiError`, sin
 * importar si la lanzo Nest, un guard o un service. El frontend decide en base
 * al `code`, nunca al texto del mensaje.
 *
 * Los errores no controlados se loguean completos y se responden como
 * INTERNAL_ERROR generico: el detalle interno no cruza la red.
 */
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const context = host.switchToHttp();
    const request = context.getRequest<Request>();
    const response = context.getResponse<Response>();

    const { statusCode, code, message, fields } = this.describe(exception, request);

    const body: ApiError = {
      success: false,
      error: fields ? { code, message, fields } : { code, message },
      statusCode,
      path: request.url,
      timestamp: new Date().toISOString(),
    };

    response.status(statusCode).json(body);
  }

  private describe(
    exception: unknown,
    request: Request,
  ): { statusCode: number; code: ApiErrorCode; message: string; fields?: FieldError[] } {
    if (exception instanceof HttpException) {
      const statusCode = exception.getStatus();
      const payload = exception.getResponse();

      if (isStructuredBody(payload)) {
        const code =
          typeof payload.code === 'string'
            ? (payload.code as ApiErrorCode)
            : (STATUS_TO_CODE[statusCode] ?? 'INTERNAL_ERROR');
        const message = typeof payload.message === 'string' ? payload.message : exception.message;

        return { statusCode, code, message, fields: toFieldErrors(payload.fields) };
      }

      return {
        statusCode,
        code: STATUS_TO_CODE[statusCode] ?? 'INTERNAL_ERROR',
        message: typeof payload === 'string' ? payload : exception.message,
      };
    }

    this.logger.error(
      `Error no controlado en ${request.method} ${request.url}`,
      exception instanceof Error ? exception.stack : String(exception),
    );

    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      code: 'INTERNAL_ERROR',
      message: 'Ocurrio un error inesperado',
    };
  }
}
