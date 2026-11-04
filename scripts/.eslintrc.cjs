/**
 * Lints the operational scripts with the Node.js rules the packages use. They run through tsx
 * and are typechecked by `scripts/tsconfig.json`.
 */
module.exports = {
  extends: ['@ffp/eslint-config/node'],
  parserOptions: {
    project: ['./tsconfig.json'],
    tsconfigRootDir: __dirname,
  },
  ignorePatterns: ['*.tsbuildinfo'],
};
