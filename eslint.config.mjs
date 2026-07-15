import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';
import prettier from 'eslint-config-prettier';
import prettierPlugin from 'eslint-plugin-prettier/recommended';

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  prettier,
  prettierPlugin,
  {
    rules: {
      'prettier/prettier': 'error',
      '@next/next/no-img-element': 'warn',
      'react/no-unescaped-entities': 'off',
    },
  },
  globalIgnores([
    '.next/**',
    'out/**',
    'build/**',
    'next-env.d.ts',
    'playwright-report/**',
    'test-results/**',
    'coverage/**',
    'docs/plans/**',
    'lib/generated/**',
    'prisma/migrations/**',
  ]),
]);

export default eslintConfig;
