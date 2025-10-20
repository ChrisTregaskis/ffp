/**
 * ESLint configuration for @ffp/functions package
 * Uses Node.js configuration for Lambda functions
 */
module.exports = {
  extends: ['@ffp/eslint-config/node'],
  parserOptions: {
    project: './tsconfig.json',
    tsconfigRootDir: __dirname,
  },
  ignorePatterns: ['dist', 'node_modules'],
};
