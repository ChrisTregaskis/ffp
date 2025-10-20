/**
 * Shared Prettier configuration for FFP monorepo
 * Enforces consistent code formatting across all packages
 *
 * Follows FFP coding standards:
 * - 2 spaces indentation
 * - 100 character line length
 * - Single quotes (except JSX)
 * - Always use semicolons
 * - Trailing commas in multi-line structures
 */
module.exports = {
  // Line length
  printWidth: 100,

  // Indentation
  tabWidth: 2,
  useTabs: false,

  // Quotes and punctuation
  semi: true,
  singleQuote: true,
  quoteProps: 'as-needed',
  jsxSingleQuote: false, // Use double quotes in JSX

  // Trailing commas
  trailingComma: 'es5',

  // Brackets and spacing
  bracketSpacing: true,
  bracketSameLine: false,
  arrowParens: 'always',

  // Line endings (LF for Unix/Mac)
  endOfLine: 'lf',

  // Prose formatting
  proseWrap: 'preserve',

  // HTML whitespace
  htmlWhitespaceSensitivity: 'css',

  // Embedded language formatting
  embeddedLanguageFormatting: 'auto',
};
