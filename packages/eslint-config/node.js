/**
 * ESLint configuration for Node.js packages (functions, core)
 * Extends base config with Node.js-specific rules
 */
module.exports = {
  extends: ['./base.js'],
  env: {
    node: true,
    es2022: true,
  },
  rules: {
    // Node.js specific
    'no-console': 'off', // Console logging is acceptable in Lambda functions
    'no-process-env': 'off', // Environment variables are expected in Lambda

    // Prefer async/await over callbacks
    'prefer-promise-reject-errors': 'error',
  },
};
