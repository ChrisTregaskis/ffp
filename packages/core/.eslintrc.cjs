/**
 * ESLint configuration for @ffp/core package
 * Uses Node.js configuration for shared business logic
 */
module.exports = {
  extends: ['@ffp/eslint-config/node'],
  parserOptions: {
    project: ['./tsconfig.json', './tsconfig.node.json', './tsconfig.test.json'],
    tsconfigRootDir: __dirname,
  },
  ignorePatterns: ['dist', 'node_modules', 'sst-env.d.ts', '*.tsbuildinfo'],
  overrides: [
    {
      files: ['src/**/*.ts'],
      excludedFiles: ['src/**/*.test.ts'],
      rules: {
        'no-restricted-imports': [
          'error',
          {
            paths: [
              {
                name: '@ffp/database/testing',
                message: 'Test-only helpers; production code must not import them.',
              },
            ],
          },
        ],
      },
    },
  ],
};
