import { describe, expect, it } from 'vitest';

import { toListParams } from './list-params';

const PAGINATION = { page: 2, pageSize: 10, sortBy: 'name', sortDirection: 'asc' as const };

describe('toListParams', () => {
  it('writes the page and sort as strings', () => {
    expect(toListParams(PAGINATION)).toEqual({
      page: '2',
      pageSize: '10',
      sortBy: 'name',
      sortDirection: 'asc',
    });
  });

  it('passes set filters through', () => {
    expect(toListParams(PAGINATION, { search: 'balance', isActive: 'true' })).toMatchObject({
      search: 'balance',
      isActive: 'true',
    });
  });

  it('leaves blank filters out', () => {
    const params = toListParams(PAGINATION, { search: '', status: undefined });

    expect(params.search).toBeUndefined();
    expect(params.status).toBeUndefined();
  });
});
