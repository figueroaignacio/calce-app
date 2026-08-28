/**
 * @calce/db - esquema Drizzle, cliente de base de datos y migraciones.
 *
 * Solo el backend depende de este paquete. @calce/types no lo importa nunca:
 * el frontend consume los contratos y no puede arrastrar Drizzle ni el driver
 * de Neon a su bundle.
 */
export * from './client.js';
export * from './normalize.js';
export * as schema from './schema/index.js';
export * from './schema/index.js';
