import { Module } from '@nestjs/common';

/**
 * Modulo de reports - todavia sin implementar.
 *
 * Queda registrado en `AppModule` para que las rutas aparezcan en cuanto se
 * escriba el controller. La anatomia a seguir es la de `products`:
 * `reports.controller.ts`, `reports.service.ts`, `reports.repository.ts` y la
 * carpeta `dto/`, con la separacion estricta entre HTTP, negocio y Drizzle.
 *
 * TODO:
 * Alcance pendiente:
 * - Ventas por periodo, por vendedor y por cliente.
 * - Productos mas vendidos y productos sin movimiento.
 * - Stock por debajo del minimo y valorizacion del inventario.
 * - Las consultas son agregaciones de solo lectura: conviene resolverlas con
 *   SQL directo en el repositorio antes que armandolas en memoria.
 */
@Module({})
export class ReportsModule {}
