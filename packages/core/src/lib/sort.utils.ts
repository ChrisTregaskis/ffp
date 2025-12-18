export type SortDirection = 'asc' | 'desc';

export interface SortCriterion<T> {
  field: keyof T;
  direction?: SortDirection;
}

export type SortField<T> = keyof T | SortCriterion<T>;

function normaliseCriterion<T>(field: SortField<T>): SortCriterion<T> {
  if (typeof field === 'object' && 'field' in field) {
    return { direction: 'asc', ...field };
  }
  return { field, direction: 'asc' };
}

/**
 * Compare two values for sorting
 */
function compareValues(a: unknown, b: unknown, direction: SortDirection): number {
  const multiplier = direction === 'asc' ? 1 : -1;

  // Handle null/undefined - push to end regardless of direction
  if (a == null && b == null) return 0;
  if (a == null) return 1;
  if (b == null) return -1;

  // Handle Date objects
  if (a instanceof Date && b instanceof Date) {
    return (a.getTime() - b.getTime()) * multiplier;
  }

  // Handle numbers
  if (typeof a === 'number' && typeof b === 'number') {
    return (a - b) * multiplier;
  }

  // Handle booleans (true > false)
  if (typeof a === 'boolean' && typeof b === 'boolean') {
    return (Number(a) - Number(b)) * multiplier;
  }

  // Handle strings (case-insensitive)
  if (typeof a === 'string' && typeof b === 'string') {
    return a.localeCompare(b) * multiplier;
  }

  // Fallback: convert to string and compare
  return String(a).localeCompare(String(b)) * multiplier;
}

/**
 * Sort an array of objects by one or two fields with optional direction control.
 *
 * @returns New sorted array
 *
 * @example
 * ```typescript
 * // Simple - sort by single field (ascending by default)
 * const sorted = sortBy(users, ['name']);
 *
 * // Sort by two fields
 * const sorted = sortBy(jobs, ['priority', 'createdAt']);
 *
 * // With direction control
 * const sorted = sortBy(jobs, [
 *   { field: 'priority', direction: 'asc' },
 *   { field: 'createdAt', direction: 'desc' }
 * ]);
 *
 * // Mix field names and criterion objects
 * const sorted = sortBy(jobs, ['priority', { field: 'createdAt', direction: 'desc' }]);
 * ```
 */
export function sortBy<T>(
  items: T[],
  criteria: [SortField<T>] | [SortField<T>, SortField<T>]
): T[] {
  const first = normaliseCriterion(criteria[0]);
  const second = criteria.length === 2 ? normaliseCriterion(criteria[1]) : undefined;

  return [...items].sort((a, b) => {
    // Compare by first criterion
    const firstResult = compareValues(a[first.field], b[first.field], first.direction ?? 'asc');

    // If equal and we have a second criterion, compare by that
    if (firstResult === 0 && second) {
      return compareValues(a[second.field], b[second.field], second.direction ?? 'asc');
    }

    return firstResult;
  });
}
