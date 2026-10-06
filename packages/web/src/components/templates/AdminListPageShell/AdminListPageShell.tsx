import { useMemo } from 'react';

import type { PaginationInput } from '@ffp/core';

import type { IconName } from '@web/components/atoms';
import { Button, Icon, PageContainer } from '@web/components/atoms';
import { PageHeader } from '@web/components/molecules';
import { Table, TableControls } from '@web/components/organisms';
import type { TableFilterConfig, TableFilterValues } from '@web/components/organisms';
import { useApiTable } from '@web/hooks/useApiTable';

import type { UseQueryResult } from '@tanstack/react-query';
import type { ColumnDef } from '@tanstack/react-table';
import type { ReactNode } from 'react';

/** The search, then each configured filter by its key; blank values are left out */
export type ListFilterValues = Record<string, string | undefined>;

interface ListPage<TItem> {
  data: TItem[];
  pagination: { total: number };
}

export interface ListEmptyStateControls {
  hasActiveControls: boolean;
  hasNonDefaultControls: boolean;
}

export interface AdminListPageShellProps<
  TItem,
  TRow extends { id: string } & Record<string, unknown>,
> {
  title: string;
  subtitle: string;
  createLabel: string;
  /** @default 'Plus' */
  createIcon?: IconName;
  onCreate: () => void;
  tableId: string;
  defaultSort: { id: string; desc: boolean };
  defaultFilters?: TableFilterValues;
  defaultColumnVisibility?: Record<string, boolean>;
  /** Define at module level; each key is sent to `useList` as a filter */
  filters: TableFilterConfig[];
  searchPlaceholder: string;
  searchWidthClass?: string;
  /** The resource's list query. Called as a hook, so pass the same function every render. */
  useList: (
    pagination: PaginationInput,
    filters: ListFilterValues
  ) => Pick<UseQueryResult<ListPage<TItem>>, 'data' | 'isLoading' | 'error'>;
  /** Keep it stable (module level, or memoised) so the rows memo holds */
  toRow: (item: TItem) => TRow;
  columns: ColumnDef<TRow>[];
  /** Each list decides whether its default filters count as narrowing the results */
  renderEmptyState: (controls: ListEmptyStateControls) => ReactNode;
  /** Rendered after the table — modals and the like */
  children?: ReactNode;
}

/** Page frame shared by the admin list screens: header, server-driven table and its controls. */
export const AdminListPageShell = <TItem, TRow extends { id: string } & Record<string, unknown>>({
  title,
  subtitle,
  createLabel,
  createIcon = 'Plus',
  onCreate,
  tableId,
  defaultSort,
  defaultFilters,
  defaultColumnVisibility,
  filters,
  searchPlaceholder,
  searchWidthClass,
  useList,
  toRow,
  columns,
  renderEmptyState,
  children,
}: AdminListPageShellProps<TItem, TRow>): JSX.Element => {
  const {
    onStateChange,
    queryParams,
    search,
    onSearchChange,
    filterValues,
    onFilterChange,
    debouncedSearch,
    debouncedFilters,
    clearAll,
    hasActiveControls,
    hasNonDefaultControls,
  } = useApiTable({ defaultPageSize: 10, defaultSort, defaultFilters });

  const listFilters = useMemo((): ListFilterValues => {
    const values: ListFilterValues = { search: debouncedSearch || undefined };

    for (const { key } of filters) {
      const value = debouncedFilters[key];
      values[key] = value ? String(value) : undefined;
    }

    return values;
  }, [debouncedSearch, debouncedFilters, filters]);

  const { data, isLoading, error } = useList(queryParams, listFilters);

  const rows = useMemo(() => (data ? data.data.map(toRow) : []), [data, toRow]);

  return (
    <PageContainer>
      <PageHeader
        title={title}
        subtitle={subtitle}
        actions={
          <Button
            variant="primary"
            icon={<Icon name={createIcon} styleProps={{ size: 'sm', colour: 'currentColor' }} />}
            onClick={onCreate}
          >
            {createLabel}
          </Button>
        }
      />

      <Table<TRow>
        tableId={tableId}
        data={rows}
        columns={columns}
        totalRows={data?.pagination.total ?? 0}
        isLoading={isLoading}
        error={error?.message}
        onStateChange={onStateChange}
        defaultSort={defaultSort}
        defaultColumnVisibility={defaultColumnVisibility}
        getRowId={(row) => row.id}
        emptyState={renderEmptyState({ hasActiveControls, hasNonDefaultControls })}
        renderControls={(cols) => (
          <TableControls
            search={search}
            onSearchChange={onSearchChange}
            searchPlaceholder={searchPlaceholder}
            searchWidthClass={searchWidthClass}
            filters={filters}
            filterValues={filterValues}
            onFilterChange={onFilterChange}
            columns={cols}
            onClearAll={clearAll}
            hasActiveControls={hasActiveControls}
          />
        )}
      />

      {children}
    </PageContainer>
  );
};
