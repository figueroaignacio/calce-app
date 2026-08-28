import { Module } from '@nestjs/common';

/**
 * Modulo de orders - todavia sin implementar.
 *
 * Queda registrado en `AppModule` para que las rutas aparezcan en cuanto se
 * escriba el controller. La anatomia a seguir es la de `products`:
 * `orders.controller.ts`, `orders.service.ts`, `orders.repository.ts` y la
 * carpeta `dto/`, con la separacion estricta entre HTTP, negocio y Drizzle.
 *
 * TODO:
 * Alcance pendiente:
 * - Alta de pedido con calculo de subtotales, descuentos y total en el service.
 * - Numeracion correlativa sin huecos ni colisiones bajo concurrencia.
 * - Transiciones de estado validadas: solo DRAFT es editable; CONFIRMED reserva
 *   stock; SHIPPED lo descuenta; CANCELLED libera lo reservado.
 * - Todo cambio de estado que toque stock corre en una sola transaccion junto
 *   con los asientos de `stock_movements`. Es la razon por la que el cliente
 *   usa el driver WebSocket de Neon y no el HTTP.
 */
@Module({})
export class OrdersModule {}
