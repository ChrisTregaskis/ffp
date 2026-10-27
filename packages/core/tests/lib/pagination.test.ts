import { describe, expect, it } from 'vitest';

import { programmeTemplates } from '@ffp/database/schema';

import { NEWEST_FIRST, withDefaultSort } from '../../src/lib/pagination';

const COLUMNS = { name: programmeTemplates.name, createdAt: programmeTemplates.createdAt };

describe('withDefaultSort', () => {
  it('falls back to the default for a key the columns only inherit, such as constructor', () => {
    expect(
      withDefaultSort(
        { page: 1, pageSize: 10, sortBy: 'constructor', sortDirection: 'asc' },
        COLUMNS,
        NEWEST_FIRST
      )
    ).toEqual({ page: 1, pageSize: 10, sortBy: 'createdAt', sortDirection: 'desc' });
  });
});
