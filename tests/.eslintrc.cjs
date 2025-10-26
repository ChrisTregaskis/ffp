module.exports = {
  extends: ['@ffp/eslint-config/base'],
  parserOptions: {
    project: './tsconfig.json',
    tsconfigRootDir: __dirname,
  },
  env: {
    node: true,
  },
  ignorePatterns: ['sst-env.d.ts'],
  rules: {
    // Test files can be less strict with type safety
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/no-unsafe-assignment': 'off',
    '@typescript-eslint/no-unsafe-member-access': 'off',
    '@typescript-eslint/no-unsafe-call': 'off',
    '@typescript-eslint/no-unsafe-return': 'off',
    '@typescript-eslint/no-unsafe-argument': 'off',
    '@typescript-eslint/restrict-template-expressions': 'off',
    // Allow require statements for dynamic imports in tests
    '@typescript-eslint/no-var-requires': 'off',
    '@typescript-eslint/no-require-imports': 'off',
    // Allow non-null assertions in tests for brevity
    '@typescript-eslint/no-non-null-assertion': 'off',
    // Allow console.log in tests for debugging
    'no-console': 'off',
  },
};
