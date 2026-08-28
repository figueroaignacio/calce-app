import { Module } from '@nestjs/common';

/**
 * Modulo de stock - todavia sin implementar.
 *
 * Queda registrado en `AppModule` para que las rutas aparezcan en cuanto se
 * escriba el controller. La anatomia a seguir es la de `products`:
 * `stock.controller.ts`, `stock.service.ts`, `stock.repository.ts` y la
 * carpeta `dto/`, con la separacion estricta entre HTTP, negocio y Drizzle.
 *
 * TODO:
 * Alcance pendiente:
 * - Registro de movimientos (INBOUND, OUTBOUND, ADJUSTMENT, RESERVATION),
 *   siempre calculando `resulting_stock` dentro de la misma transaccion en la
 *   que se lee el ultimo asiento del producto.
 * - Consulta de existencias: fisico, reservado y disponible.
 * - Alertas de productos por debajo de `min_stock`.
 * - Los movimientos son inmutables: una correccion se registra como un asiento
 *   nuevo de tipo ADJUSTMENT, nunca editando el original.
 */
@Module({})
export class StockModule {}
