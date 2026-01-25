/**
 * Convert minutes to milliseconds
 * @throws Error if minutes is negative
 */
export const minutesToMs = (minutes: number): number => {
  if (minutes < 0) {
    throw new Error('Minutes cannot be negative');
  }
  return minutes * 60 * 1000;
};

/**
 * Convert seconds to milliseconds
 * @throws Error if seconds is negative
 */
export const secondsToMs = (seconds: number): number => {
  if (seconds < 0) {
    throw new Error('Seconds cannot be negative');
  }
  return seconds * 1000;
};
