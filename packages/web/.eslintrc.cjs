/**
 * ESLint configuration for @ffp/web package
 * Uses React configuration for frontend application
 */
module.exports = {
  extends: ['@ffp/eslint-config/react'],
  parserOptions: {
    project: ['./tsconfig.json', './tsconfig.node.json', './tsconfig.test.json'],
    tsconfigRootDir: __dirname,
  },
  ignorePatterns: ['dist', 'node_modules'],
};
