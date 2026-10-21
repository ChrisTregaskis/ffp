/**
 * ESLint configuration for @ffp/database package
 * Uses Node.js configuration. Covers the tests and config files; the production
 * sources, seeds and scripts are not lint-clean yet, so they are left out for now.
 */
module.exports = {
  extends: ['@ffp/eslint-config/node'],
  parserOptions: {
    project: ['./tsconfig.node.json', './tsconfig.test.json'],
    tsconfigRootDir: __dirname,
  },
  ignorePatterns: [
    'dist',
    'node_modules',
    'migrations',
    '*.tsbuildinfo',
    'seed',
    'scripts',
    'src/**/*.ts',
    '!src/**/*.test.ts',
  ],
};
