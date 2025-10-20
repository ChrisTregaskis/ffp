/**
 * ESLint configuration for @ffp/core package
 * Uses Node.js configuration for shared business logic
 */
module.exports = {
  extends: ['@ffp/eslint-config/node'],
  parserOptions: {
    project: './tsconfig.json',
    tsconfigRootDir: __dirname,
  },
  ignorePatterns: ['dist', 'node_modules'],
};
