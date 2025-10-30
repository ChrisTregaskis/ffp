/**
 * Terminal Logger Utility
 *
 * Provides consistent, colored terminal output for migration scripts.
 *
 * @module lib/terminal-logger
 */

/**
 * ANSI color codes for terminal output
 */
const colors = {
  reset: '\x1b[0m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
} as const;

/**
 * Terminal prefix types
 */
export enum TerminalPrefix {
  INFO = 'INFO',
  MIGRATE = 'MIGRATE',
  RLS = 'RLS',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR',
  WARNING = 'WARNING',
}

/**
 * Map prefix types to their colors
 */
const prefixColors: Record<TerminalPrefix, keyof typeof colors> = {
  [TerminalPrefix.INFO]: 'blue',
  [TerminalPrefix.MIGRATE]: 'blue',
  [TerminalPrefix.RLS]: 'cyan',
  [TerminalPrefix.SUCCESS]: 'green',
  [TerminalPrefix.ERROR]: 'red',
  [TerminalPrefix.WARNING]: 'yellow',
};

/**
 * Generate a colored terminal prefix
 *
 * @param prefix - The prefix type to generate
 * @returns Formatted colored prefix string
 *
 * @example
 * console.log(`${terminalPrefix(TerminalPrefix.SUCCESS)} Migration complete`);
 * // Output: [SUCCESS] Migration complete (with green color)
 */
export function terminalPrefix(prefix: TerminalPrefix): string {
  const color = prefixColors[prefix];
  return `${colors[color]}[${prefix}]${colors.reset}`;
}

/**
 * Generate colored status text (for inline coloring)
 *
 * @param text - The text to color
 * @param color - The color to apply
 * @returns Colored text string
 *
 * @example
 * console.log(`RLS Status: ${colorText('Enabled', 'green')}`);
 * // Output: RLS Status: Enabled (with green color)
 */
export function colorText(
  text: string,
  color: 'blue' | 'cyan' | 'green' | 'red' | 'yellow'
): string {
  return `${colors[color]}${text}${colors.reset}`;
}
