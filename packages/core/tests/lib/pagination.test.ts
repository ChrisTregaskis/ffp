import { drizzle } from 'drizzle-orm/node-postgres';
import { describe, expect, it } from 'vitest';

import { programmeTemplates } from '@ffp/database/schema';

import { applyPagination, NEWEST_FIRST, withDefaultSort } from '../../src/lib/pagination';

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

describe('applyPagination', () => {
  const orderedBy = (sortBy: string): string =>
    applyPagination(
      drizzle.mock().select().from(programmeTemplates).$dynamic(),
      { page: 1, pageSize: 10, sortBy, sortDirection: 'asc' },
      COLUMNS,
      programmeTemplates.id
    ).toSQL().sql;

  it('orders by a sortable column, then the tie-breaker', () => {
    expect(orderedBy('name')).toMatch(
      /order by "programme_templates"\."name" asc, "programme_templates"\."id" asc/
    );
  });

  it('adds no ORDER BY for a key the columns only inherit, such as constructor', () => {
    expect(orderedBy('constructor')).not.toMatch(/order by/i);
  });
});
