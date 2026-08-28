import prettier from 'eslint-config-prettier';
import { apiConfig, baseConfig } from '../../eslint.config.base.mjs';

export default [...baseConfig, ...apiConfig(), prettier];
