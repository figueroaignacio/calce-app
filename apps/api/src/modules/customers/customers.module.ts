import { Module } from '@nestjs/common';

/**
 * Modulo de customers - todavia sin implementar.
 *
 * Queda registrado en `AppModule` para que las rutas aparezcan en cuanto se
 * escriba el controller. La anatomia a seguir es la de `products`:
 * `customers.controller.ts`, `customers.service.ts`, `customers.repository.ts` y la
 * carpeta `dto/`, con la separacion estricta entre HTTP, negocio y Drizzle.
 *
 * TODO:
 * Alcance pendiente:
 * - CRUD de clientes con paginacion, filtros y orden, siguiendo el patron de
 *   `products`.
 * - Validacion del digito verificador del CUIT, no solo su longitud.
 * - Asignacion de lista de precios (requiere crear antes la tabla
 *   `price_lists`, hoy `customers.price_list_id` es una referencia suelta).
 */
@Module({})
export class CustomersModule {}
