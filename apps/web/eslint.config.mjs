import prettier from 'eslint-config-prettier';
import { baseConfig, webConfig } from '../../eslint.config.base.mjs';

export default [...baseConfig, ...webConfig(), prettier];
