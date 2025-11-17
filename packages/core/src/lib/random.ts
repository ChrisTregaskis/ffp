import { randomInt } from 'node:crypto';

/**
 * Character set containing uppercase letters and numbers
 */
const ALPHANUMERIC_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

/**
 * Generate a cryptographically secure random alphanumeric string
 *
 * Creates a random string using uppercase letters (A-Z) and digits (0-9).
 * Uses Node.js crypto.randomInt for cryptographically secure random generation,
 * making it suitable for security-sensitive identifiers like account codes.
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
export const generateRandomAlphanumeric = (length: number): string => {
  return Array.from({ length }, () =>
    ALPHANUMERIC_CHARS.charAt(randomInt(0, ALPHANUMERIC_CHARS.length))
  ).join('');
};
