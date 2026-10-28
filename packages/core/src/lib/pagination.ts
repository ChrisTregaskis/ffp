import { asc, desc, type Column } from 'drizzle-orm';

import type { PaginationInput } from '../schemas/pagination.schema';
import type { PgSelect } from 'drizzle-orm/pg-core';

/**
 * The column a sort key names, or undefined. `Object.hasOwn`, so an inherited key such as
 * `constructor` is not taken for a column.
 */
export const sortColumnFor = (
  sortBy: string | undefined,
  sortableColumns: Partial<Record<string, Column>>
): Column | undefined =>
  sortBy !== undefined && Object.hasOwn(sortableColumns, sortBy)
    ? sortableColumns[sortBy]
    : undefined;

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

  const column = sortColumnFor(input.sortBy, sortableColumns);

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
 */
export const withDefaultSort = (
  input: PaginationInput,
  sortableColumns: Partial<Record<string, Column>>,
  defaultSort: Required<Pick<PaginationInput, 'sortBy' | 'sortDirection'>>
): PaginationInput =>
  sortColumnFor(input.sortBy, sortableColumns) ? input : { ...input, ...defaultSort };

/**
 * Escapes the LIKE wildcards (`%`, `_`) and the escape character itself (`\`) in user input,
 * so each matches literally. Drizzle's `ilike` emits no ESCAPE clause, so Postgres applies its
 * default escape character, the backslash this escapes with.
 *
 * @example
 * ```typescript
 * const pattern = `%${escapeLikePattern(userInput)}%`;
 * conditions.push(ilike(table.name, pattern));
 * ```
 */
export const escapeLikePattern = (input: string): string => input.replace(/[\\%_]/g, '\\$&');
