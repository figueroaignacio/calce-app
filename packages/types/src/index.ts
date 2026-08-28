/**
 * @calce/types - contratos de la API compartidos entre @calce/web y @calce/api.
 *
 * Regla dura: este paquete no puede depender de @calce/db ni de nada del
 * backend. El frontend lo importa, asi que arrastrar Drizzle o el driver de
 * Neon al bundle del navegador no es una opcion. Los contratos se definen de
 * forma independiente del esquema de base de datos, aunque lo reflejen.
 */
export * from './common/index.js';
export * from './enums/index.js';
export * from './entities/index.js';
export * from './auth/index.js';
