/**
 * UUID ↔ short ID encoding utilities.
 *
 * Converts standard UUIDs (36 chars) to compact base62 strings (~22 chars)
 * for cleaner URLs. Pure frontend — no backend changes needed.
 *
 * Example: "aaaaaaaa-aaaa-aaaa-8aaa-aaaaaaaaaa12" → "5ly6IbSVNSatmbQ0M0sHK"
 */

const BASE62_CHARS = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';

/** Encode a UUID to a compact base62 string */
export const encodeUuid = (uuid: string): string => {
  const hex = uuid.replace(/-/g, '');
  let num = BigInt(`0x${hex}`);
  const chars: string[] = [];

  while (num > 0n) {
    chars.unshift(BASE62_CHARS[Number(num % 62n)]);
    num = num / 62n;
  }

  return chars.join('') || '0';
};

/** Decode a base62 string back to a UUID */
export const decodeUuid = (shortId: string): string => {
  let num = 0n;

  for (const char of shortId) {
    const index = BASE62_CHARS.indexOf(char);

    if (index === -1) {
      throw new Error(`Invalid base62 character: ${char}`);
    }

    num = num * 62n + BigInt(index);
  }

  const hex = num.toString(16).padStart(32, '0');

  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    hex.slice(12, 16),
    hex.slice(16, 20),
    hex.slice(20, 32),
  ].join('-');
};
