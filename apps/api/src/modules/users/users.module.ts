import { Module } from '@nestjs/common';

/**
 * Modulo de users - todavia sin implementar.
 *
 * Queda registrado en `AppModule` para que las rutas aparezcan en cuanto se
 * escriba el controller. La anatomia a seguir es la de `products`:
 * `users.controller.ts`, `users.service.ts`, `users.repository.ts` y la
 * carpeta `dto/`, con la separacion estricta entre HTTP, negocio y Drizzle.
 *
 * TODO:
 * Alcance pendiente:
 * - CRUD de usuarios restringido a ADMIN.
 * - Alta con contrasena provisoria y cambio obligatorio en el primer ingreso.
 * - Cambio de rol y baja logica (`is_active`), nunca borrado fisico: los
 *   usuarios quedan referenciados por pedidos y movimientos de stock.
 * - Cambio de contrasena propio, verificando la actual.
 */
@Module({})
export class UsersModule {}
