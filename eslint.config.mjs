import js from '@eslint/js';
import globals from 'globals';

// Flat config (ESLint 9). Lints the plain ESM sources in lib/, bin/, and test/ with the
// recommended rule set on top of node --check / node --test. Node + ES globals only.
export default [
  { ignores: ['node_modules/**'] },
  js.configs.recommended,
  {
    files: ['**/*.mjs'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: { ...globals.node },
    },
    rules: {
      // Honor the `_name` convention for intentionally-unused params/vars/catch bindings.
      'no-unused-vars': ['error', {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        caughtErrorsIgnorePattern: '^_',
      }],
    },
  },
];
