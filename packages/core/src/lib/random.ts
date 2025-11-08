/**
 * Character set containing uppercase letters and numbers
 */
const ALPHANUMERIC_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

/**
 * Generate a random alphanumeric string
 *
 * Creates a random string using uppercase letters (A-Z) and digits (0-9).
 * Useful for generating account codes, identifiers, and other random tokens.
 *
 * @param length - The desired length of the random string
 * @returns Random alphanumeric string of specified length
 *
 * @example
 * ```typescript
 * generateRandomAlphanumeric(4) // Returns: "A3B9"
 * generateRandomAlphanumeric(8) // Returns: "M7K4F2R8"
 * ```
 */
export function generateRandomAlphanumeric(length: number): string {
  return Array.from({ length }, () =>
    ALPHANUMERIC_CHARS.charAt(Math.floor(Math.random() * ALPHANUMERIC_CHARS.length))
  ).join('');
}
