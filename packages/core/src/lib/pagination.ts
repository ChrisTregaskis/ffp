import { asc, desc, type Column } from 'drizzle-orm';

import type { PaginationInput } from '../schemas/pagination.schema';
import type { PgSelect } from 'drizzle-orm/pg-core';

/**
 * Applies pagination (offset/limit) and sorting to a Drizzle query.
 *
 * Usage:
 *   const query = db.select().from(videos).where(...).$dynamic();
 *   const results = await applyPagination(query, input, sortableColumns);
 *
 * `tieBreaker` (a unique column) orders rows the sort column leaves tied, so
 * a page boundary cannot fall differently between requests.
 */
export const applyPagination = <T extends PgSelect>(
  query: T,
  input: PaginationInput,
  sortableColumns: Partial<Record<string, Column>>,
  tieBreaker?: Column
): T => {
  const offset = (input.page - 1) * input.pageSize;

  let result = query.limit(input.pageSize).offset(offset);

  const column = input.sortBy ? sortableColumns[input.sortBy] : undefined;

  if (column) {
    const primary = input.sortDirection === 'desc' ? desc(column) : asc(column);

    result = tieBreaker ? result.orderBy(primary, asc(tieBreaker)) : result.orderBy(primary);
  }

  return result;
};

/** The default for admin lists whose page opens newest first. */
export const NEWEST_FIRST = { sortBy: 'createdAt', sortDirection: 'desc' } as const;

/**
 * The caller's sort when it names a sortable column, otherwise the list's default. The
 * default replaces the direction too: a direction sent without a column has nothing to order.
 * `Object.hasOwn`, so an inherited key such as `constructor` is not taken for a column.
 */
export const withDefaultSort = (
  input: PaginationInput,
  sortableColumns: Partial<Record<string, Column>>,
  defaultSort: Required<Pick<PaginationInput, 'sortBy' | 'sortDirection'>>
): PaginationInput =>
  input.sortBy && Object.hasOwn(sortableColumns, input.sortBy)
    ? input
    : { ...input, ...defaultSort };

/**
 * Escapes SQL LIKE wildcard characters (% and _) in user input.
 * Use when building ILIKE patterns from search strings.
 *
 * @example
 * ```typescript
 * const pattern = `%${escapeLikePattern(userInput)}%`;
 * conditions.push(ilike(table.name, pattern));
 * ```
 */
export const escapeLikePattern = (input: string): string => {
  return input.replace(/%/g, '\\%').replace(/_/g, '\\_');
};
