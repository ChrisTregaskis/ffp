/**
 * ESLint configuration for @ffp/functions package
 * Uses Node.js configuration for Lambda functions
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
    {
      files: ['src/**/*.ts'],
      excludedFiles: ['src/**/*.test.ts', 'src/lib/request-body.ts'],
      rules: {
        'no-restricted-syntax': [
          'error',
          {
            selector: "CallExpression[callee.object.name='JSON'][callee.property.name='parse']",
            message:
              'Parse a request body with parseJsonBody (lib/request-body), which answers a missing or malformed one with 400 rather than 500.',
          },
        ],
      },
    },
  ],
};
