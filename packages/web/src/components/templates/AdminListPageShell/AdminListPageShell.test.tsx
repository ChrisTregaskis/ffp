import { fireEvent, render, screen, within } from '@testing-library/react';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';

import { ACTIVE_STATUS_FILTER } from '@web/components/organisms';
import type { TableFilterConfig } from '@web/components/organisms';

import { AdminListPageShell } from './AdminListPageShell';

import type { AdminListEmptyState } from './AdminListPageShell';
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

const EMPTY_STATE: AdminListEmptyState = {
  filteredTitle: 'No matching things',
  icon: 'Box',
  iconVariant: 'primary',
  title: 'No things yet',
  description: 'Create your first thing.',
};

const onCreate = vi.fn();

const renderShell = (
  useList: Parameters<typeof AdminListPageShell<Row, Row>>[0]['useList'],
  emptyState: AdminListEmptyState = EMPTY_STATE
): void => {
  render(
    <AdminListPageShell<Row, Row>
      title="Things"
      subtitle="All the things"
      createLabel="Create Thing"
      onCreate={onCreate}
      tableId="test-things"
      defaultSort={DEFAULT_SORT}
      defaultFilters={{ isActive: 'true' }}
      filters={FILTERS}
      searchPlaceholder="Search..."
      useList={useList}
      toRow={toRow}
      columns={COLUMNS}
      emptyState={emptyState}
    />
  );
};

const emptyList = vi.fn(() => ({
  data: { data: [], pagination: { total: 0 } },
  isLoading: false,
  error: null,
}));

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

  it('offers the create action on an empty list whose defaults set a baseline', () => {
    onCreate.mockReset();
    renderShell(emptyList);

    const emptyCell = screen.getByRole('cell');
    expect(within(emptyCell).getByText('No things yet')).toBeTruthy();
    fireEvent.click(within(emptyCell).getByRole('button', { name: 'Create Thing' }));
    expect(onCreate).toHaveBeenCalledTimes(1);
  });

  it('reads as filtered, with no create action, once a search narrows the list', () => {
    renderShell(emptyList);

    fireEvent.change(screen.getByPlaceholderText('Search...'), { target: { value: 'zz' } });

    const emptyCell = screen.getByRole('cell');
    expect(within(emptyCell).getByText('No matching things')).toBeTruthy();
    expect(within(emptyCell).queryByRole('button')).toBeNull();
  });

  it('reads as filtered on its defaults when the defaults narrow the list', () => {
    renderShell(emptyList, { ...EMPTY_STATE, defaultsNarrow: true });

    expect(screen.getByText('No matching things')).toBeTruthy();
  });
});
