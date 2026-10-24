/**
 * ESLint configuration for @ffp/database package
 * Uses Node.js configuration. Lints every TypeScript file in the package; only the
 * drizzle-kit output in `/migrations` is ignored (`src/migrations` is linted).
 */
module.exports = {
  extends: ['@ffp/eslint-config/node'],
  parserOptions: {
    project: [
      './tsconfig.json',
      './tsconfig.tools.json',
      './tsconfig.node.json',
      './tsconfig.test.json',
    ],
    tsconfigRootDir: __dirname,
  },
  ignorePatterns: ['dist', 'node_modules', '/migrations', 'sst-env.d.ts', '*.tsbuildinfo'],
};
