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
export function generateRandomAlphanumeric(length: number): string {
  return Array.from({ length }, () =>
    ALPHANUMERIC_CHARS.charAt(randomInt(0, ALPHANUMERIC_CHARS.length))
  ).join('');
}

/**
 * A deterministic generator of numbers in [0, 1), seeded from a string: the same seed always
 * yields the same sequence. For reproducible draws only; never for anything security-sensitive.
 * The seed is hashed with cyrb53's mixing and drives a mulberry32 generator.
 */
export function createSeededRandom(seed: string): () => number {
  let h1 = 0xdeadbeef;
  let h2 = 0x41c6ce57;

  for (let i = 0; i < seed.length; i++) {
    const code = seed.charCodeAt(i);
    h1 = Math.imul(h1 ^ code, 2654435761);
    h2 = Math.imul(h2 ^ code, 1597334677);
  }

  let state =
    (Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909)) >>> 0;

  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);

    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
