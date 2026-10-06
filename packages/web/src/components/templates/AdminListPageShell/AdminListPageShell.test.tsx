import { render, screen } from '@testing-library/react';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';

import { ACTIVE_STATUS_FILTER } from '@web/components/organisms';
import type { TableFilterConfig } from '@web/components/organisms';

import { AdminListPageShell } from './AdminListPageShell';

import type { ColumnDef } from '@tanstack/react-table';

interface Row extends Record<string, unknown> {
  id: string;
  name: string;
}

const TYPE_FILTER: TableFilterConfig = {
  key: 'type',
  label: 'Type',
  options: [{ label: 'Numeric', value: 'numeric' }],
};

const FILTERS = [TYPE_FILTER, ACTIVE_STATUS_FILTER];
const COLUMNS: ColumnDef<Row>[] = [{ id: 'name', accessorKey: 'name', header: 'Name' }];
const DEFAULT_SORT = { id: 'name', desc: false };
const toRow = (item: Row): Row => item;

const renderShell = (
  useList: Parameters<typeof AdminListPageShell<Row, Row>>[0]['useList']
): void => {
  render(
    <AdminListPageShell<Row, Row>
      title="Things"
      subtitle="All the things"
      createLabel="Create Thing"
      onCreate={vi.fn()}
      tableId="test-things"
      defaultSort={DEFAULT_SORT}
      defaultFilters={{ isActive: 'true' }}
      filters={FILTERS}
      searchPlaceholder="Search..."
      useList={useList}
      toRow={toRow}
      columns={COLUMNS}
      renderEmptyState={({ hasActiveControls, hasNonDefaultControls }) => (
        <p>{`empty active=${String(hasActiveControls)} nonDefault=${String(hasNonDefaultControls)}`}</p>
      )}
    />
  );
};

describe('AdminListPageShell', () => {
  it('sends the search and each configured filter, with blanks as undefined', () => {
    const useList = vi.fn(() => ({ data: undefined, isLoading: false, error: null }));

    renderShell(useList);

    expect(useList).toHaveBeenLastCalledWith(
      expect.objectContaining({ page: 1, pageSize: 10, sortBy: 'name', sortDirection: 'asc' }),
      { search: undefined, type: undefined, isActive: 'true' }
    );
  });

  it('maps each item to a row and renders it', () => {
    const useList = vi.fn(() => ({
      data: { data: [{ id: 'a', name: 'First thing' }], pagination: { total: 1 } },
      isLoading: false,
      error: null,
    }));

    renderShell(useList);

    expect(screen.getByText('First thing')).toBeTruthy();
  });

  it('tells the empty state whether the defaults alone are narrowing the list', () => {
    const useList = vi.fn(() => ({
      data: { data: [], pagination: { total: 0 } },
      isLoading: false,
      error: null,
    }));

    renderShell(useList);

    expect(screen.getByText('empty active=true nonDefault=false')).toBeTruthy();
  });
});
