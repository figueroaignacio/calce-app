// El paquete se publica como CommonJS (`type` ausente en package.json), asi que
// la carpeta ESM necesita su propio marcador para que Node interprete
// `dist/esm/*.js` como modulos ES.
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const packageRoot = dirname(dirname(fileURLToPath(import.meta.url)));
writeFileSync(
  join(packageRoot, 'dist', 'esm', 'package.json'),
  `${JSON.stringify({ type: 'module' }, null, 2)}\n`,
);
