/**
 * Root ESLint configuration for FFP monorepo
 * Lints root-level JavaScript config files (.eslintrc.js, .prettierrc.js, etc.)
 *
 * Note: Uses standard ESLint config (not TypeScript type-checked)
 * because root files are JavaScript, not TypeScript.
 *
 * Individual packages have their own .eslintrc.js files that extend
 * from @ffp/eslint-config with full TypeScript support.
 */
module.exports = {
  root: true,
  env: {
    node: true,
    es2022: true,
  },
  extends: [
    'eslint:recommended',
    'prettier', // Disable conflicting rules
  ],
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
  },
  rules: {
    // Code quality
    'no-console': 'off', // Console is fine in config files
    'prefer-const': 'error',
    'no-var': 'error',
    'object-shorthand': 'error',
    'prefer-template': 'error',
  },
  // Ignore all packages - they lint themselves
  ignorePatterns: [
    'packages/**',
    'node_modules/**',
    '.turbo/**',
    'dist/**',
    'build/**',
    'stacks/**',
  ],
};
