import type { PaginationInput } from '@ffp/core';

/**
 * Query parameters for a paginated admin list: the page, the sort, then each
 * filter. A blank filter is left out rather than sent as an empty value.
 */
export const toListParams = (
  pagination: PaginationInput,
  filters: object = {}
): Record<string, string | undefined> => {
  const params: Record<string, string | undefined> = {
    page: String(pagination.page),
    pageSize: String(pagination.pageSize),
    sortBy: pagination.sortBy,
    sortDirection: pagination.sortDirection,
  };

  for (const [key, value] of Object.entries(filters) as [string, unknown][]) {
    params[key] = value === undefined || value === null || value === '' ? undefined : String(value);
  }

  return params;
};
