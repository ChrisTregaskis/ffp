/** Calculate safe integer percentage (0–100), guarding against division by zero. */
export function calculatePercent(completed: number, total: number): number {
  if (total === 0) {
    return 0;
  }

  return Math.round((completed / total) * 100);
}
