import { Module } from '@nestjs/common';

/**
 * Modulo de vehicles - todavia sin implementar.
 *
 * Queda registrado en `AppModule` para que las rutas aparezcan en cuanto se
 * escriba el controller. La anatomia a seguir es la de `products`:
 * `vehicles.controller.ts`, `vehicles.service.ts`, `vehicles.repository.ts` y la
 * carpeta `dto/`, con la separacion estricta entre HTTP, negocio y Drizzle.
 *
 * TODO:
 * Alcance pendiente:
 * - ABM del arbol marca -> modelo -> version.
 * - Consulta en cascada para el selector de compatibilidad del frontend:
 *   marcas, modelos de una marca, versiones de un modelo.
 * - Busqueda de productos compatibles con una version y un anio, que es la
 *   consulta central del negocio.
 */
@Module({})
export class VehiclesModule {}
