import prettier from 'eslint-config-prettier';
import { apiConfig, baseConfig, webConfig } from './eslint.config.base.mjs';

/**
 * Configuracion del workspace completo: `pnpm lint` en la raiz.
 *
 * Los bloques especificos se montan con el prefijo de cada app para que los
 * patrones de `files` resuelvan correctamente desde la raiz.
 */
export default [...baseConfig, ...webConfig('apps/web/'), ...apiConfig('apps/api/'), prettier];
