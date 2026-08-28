import js from '@eslint/js';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import unicorn from 'eslint-plugin-unicorn';
import globals from 'globals';
import tseslint from 'typescript-eslint';

/**
 * Bloques de configuracion compartidos del monorepo.
 *
 * En flat config los patrones de `files` se resuelven contra el directorio del
 * archivo de configuracion que se este usando. Por eso los bloques especificos
 * de cada app se exportan como funciones que reciben un prefijo: la raiz los
 * monta con `apps/web/` y `apps/api/`, y cada app los monta sin prefijo.
 * Asi `pnpm lint` y `pnpm --filter @calce/web lint` aplican exactamente las
 * mismas reglas.
 */

/** Reglas que valen para todo el workspace, sin depender de rutas. */
export const baseConfig = tseslint.config(
  {
    ignores: ['**/node_modules/**', '**/dist/**', '**/build/**', '**/coverage/**', '**/drizzle/**'],
  },

  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...tseslint.configs.stylistic,

  {
    files: ['**/*.{ts,tsx,mts,cts,js,mjs,cjs,jsx}'],
    plugins: { unicorn },
    languageOptions: { globals: { ...globals.node } },
    rules: {
      // Convencion dura del proyecto: todos los archivos en kebab-case.
      'unicorn/filename-case': ['error', { case: 'kebabCase' }],
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      eqeqeq: ['error', 'always', { null: 'ignore' }],
      'object-shorthand': 'error',
      'prefer-const': 'error',
    },
  },

  // Reglas que necesitan informacion de tipos.
  {
    files: ['**/*.{ts,tsx,mts,cts}'],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/await-thenable': 'error',
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-misused-promises': 'error',
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports', fixStyle: 'inline-type-imports' },
      ],
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' },
      ],
    },
  },

  {
    files: ['**/*.spec.{ts,tsx}', '**/*.test.{ts,tsx}', '**/*.e2e-spec.ts'],
    languageOptions: { globals: { ...globals.node, ...globals.jest } },
  },

  // Los archivos de configuracion en JS plano no participan del type-checking.
  {
    files: ['**/*.{js,mjs,cjs}'],
    ...tseslint.configs.disableTypeChecked,
  },
);

/** Bloques del frontend: React en el navegador. */
export const webConfig = (prefix = '') =>
  tseslint.config({
    files: [`${prefix}**/*.{ts,tsx}`],
    plugins: { 'react-hooks': reactHooks, 'react-refresh': reactRefresh },
    languageOptions: {
      globals: { ...globals.browser },
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
    },
  });

/** Bloques del backend: NestJS depende de decoradores sobre clases. */
export const apiConfig = (prefix = '') =>
  tseslint.config({
    files: [`${prefix}**/*.ts`],
    rules: {
      '@typescript-eslint/no-extraneous-class': 'off',
      '@typescript-eslint/consistent-type-imports': 'off',
    },
  });
