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
  ignorePatterns: ['dist', 'node_modules', 'sst-env.d.ts', '*.tsbuildinfo'],
  rules: {
    // Prevent importing Node.js-only code into browser bundle
    // @ffp/database includes pg (PostgreSQL client) which uses process.env
    // Use @ffp/database/constants for browser-safe constants only
    'no-restricted-imports': [
      'error',
      {
        paths: [
          {
            name: '@ffp/database',
            message:
              'Direct @ffp/database imports bundle Node.js code (pg) into the browser. Use @ffp/database/constants for browser-safe constants.',
          },
        ],
      },
    ],
  },
};
