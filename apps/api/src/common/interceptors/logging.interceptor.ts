import {
  Injectable,
  Logger,
  type CallHandler,
  type ExecutionContext,
  type NestInterceptor,
} from '@nestjs/common';
import { type Request, type Response } from 'express';
import { tap, type Observable } from 'rxjs';

/** Deja una linea por request con metodo, ruta, estado y duracion. */
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const http = context.switchToHttp();
    const request = http.getRequest<Request>();
    const startedAt = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          const response = http.getResponse<Response>();
          this.log(request, response.statusCode, startedAt);
        },
        error: () => {
          this.log(request, http.getResponse<Response>().statusCode, startedAt);
        },
      }),
    );
  }

  private log(request: Request, statusCode: number, startedAt: number): void {
    this.logger.log(
      `${request.method} ${request.originalUrl} ${statusCode} - ${Date.now() - startedAt}ms`,
    );
  }
}
