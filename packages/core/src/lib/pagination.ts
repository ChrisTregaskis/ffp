import { asc, desc, type Column } from 'drizzle-orm';

import type { PaginationInput } from '../schemas/pagination.schema';
import type { PgSelect } from 'drizzle-orm/pg-core';

/**
 * Applies pagination (offset/limit) and sorting to a Drizzle query.
 *
 * Usage:
 *   const query = db.select().from(videos).where(...).$dynamic();
 *   const results = await applyPagination(query, input, sortableColumns);
 */
export const applyPagination = <T extends PgSelect>(
  query: T,
  input: PaginationInput,
  sortableColumns: Partial<Record<string, Column>>
): T => {
  const offset = (input.page - 1) * input.pageSize;

  let result = query.limit(input.pageSize).offset(offset);

  const column = input.sortBy ? sortableColumns[input.sortBy] : undefined;

  if (column) {
    result = result.orderBy(input.sortDirection === 'desc' ? desc(column) : asc(column));
  }

  return result;
};
