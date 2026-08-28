import { type ApiSuccessResponse } from '@calce/types';
import {
  Injectable,
  type CallHandler,
  type ExecutionContext,
  type NestInterceptor,
} from '@nestjs/common';
import { map, type Observable } from 'rxjs';

/**
 * Envuelve toda respuesta exitosa en el sobre `ApiSuccessResponse` de
 * @calce/types.
 *
 * Los controllers devuelven el dato pelado; la forma del sobre se decide en un
 * solo lugar. Los errores no pasan por aca: los arma `HttpExceptionFilter`.
 */
@Injectable()
export class TransformResponseInterceptor<TData> implements NestInterceptor<
  TData,
  ApiSuccessResponse<TData>
> {
  intercept(
    _context: ExecutionContext,
    next: CallHandler<TData>,
  ): Observable<ApiSuccessResponse<TData>> {
    return next.handle().pipe(
      map((data) => ({
        success: true as const,
        data,
        timestamp: new Date().toISOString(),
      })),
    );
  }
}
