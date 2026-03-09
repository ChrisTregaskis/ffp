import {
  useReactTable,
  getCoreRowModel,
  type SortingState,
  type PaginationState,
  type VisibilityState,
} from '@tanstack/react-table';
import { useState, useMemo, useCallback } from 'react';

import { TableBody } from './TableBody';
import { TableColumnVisibility } from './TableColumnVisibility';
import { TableHeader } from './TableHeader';
import { TablePagination } from './TablePagination';

import type { TableProps, TableState } from './types';

const DEFAULT_PAGE_SIZE_OPTIONS = [10, 20, 50];

/**
 * Reusable data table component.
 *
 * Wraps TanStack Table v8 with manual pagination and sorting, designed
 * for API-driven data fetching (via useApiTable) or static datasets.
 */
export const Table = <TData extends Record<string, unknown>>({
  tableId,
  data,
  columns,
  totalRows,
  isLoading,
  error,
  onStateChange,
  onRetry,
  defaultPageSize = 10,
  defaultSort,
  pageSizeOptions = DEFAULT_PAGE_SIZE_OPTIONS,
  emptyState,
  loadingState,
  defaultColumnVisibility,
  getRowId,
  renderControls,
}: TableProps<TData>): React.ReactElement => {
  // Internal sorting state — syncs with onStateChange callback
  const [sorting, setSorting] = useState<SortingState>(
    defaultSort ? [{ id: defaultSort.id, desc: defaultSort.desc }] : []
  );

  // Internal pagination state (0-indexed for TanStack, 1-indexed externally)
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: defaultPageSize,
  });

  // Column visibility state
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(
    defaultColumnVisibility ?? {}
  );

  // Notify parent of state changes
  const emitStateChange = useCallback(
    (sort: SortingState, pag: PaginationState) => {
      const state: TableState = {
        page: pag.pageIndex + 1,
        pageSize: pag.pageSize,
        sortBy: sort[0]?.id,
        sortDirection: sort[0]?.desc ? 'desc' : 'asc',
      };
      onStateChange(state);
    },
    [onStateChange]
  );

  // Handle sorting changes
  const handleSortingChange = useCallback(
    (updater: SortingState | ((old: SortingState) => SortingState)) => {
      const newSorting = typeof updater === 'function' ? updater(sorting) : updater;
      setSorting(newSorting);
      // Reset to first page on sort change
      const resetPagination = { pageIndex: 0, pageSize: pagination.pageSize };
      setPagination(resetPagination);
      emitStateChange(newSorting, resetPagination);
    },
    [sorting, pagination.pageSize, emitStateChange]
  );

  // Handle pagination changes
  const handlePaginationChange = useCallback(
    (updater: PaginationState | ((old: PaginationState) => PaginationState)) => {
      const newPagination = typeof updater === 'function' ? updater(pagination) : updater;
      setPagination(newPagination);
      emitStateChange(sorting, newPagination);
    },
    [pagination, sorting, emitStateChange]
  );

  // Memoised page count
  const pageCount = useMemo(
    () => Math.ceil(totalRows / pagination.pageSize),
    [totalRows, pagination.pageSize]
  );

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      pagination,
      columnVisibility,
    },
    pageCount,
    manualPagination: true,
    manualSorting: true,
    onSortingChange: handleSortingChange,
    onPaginationChange: handlePaginationChange,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getRowId: getRowId as ((row: TData) => string) | undefined,
  });

  return (
    <div className="min-w-0 w-full" data-table-id={tableId}>
      {/* Toolbar: custom controls or default column visibility */}
      {renderControls ? (
        <div className="pb-3">{renderControls(table.getAllColumns())}</div>
      ) : (
        <div className="flex items-center justify-end pb-3">
          <TableColumnVisibility columns={table.getAllColumns()} />
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-muted bg-white">
        <table className="w-full border-collapse">
          <TableHeader headerGroups={table.getHeaderGroups()} />
          <TableBody
            rows={table.getRowModel().rows}
            columns={columns}
            isLoading={isLoading}
            error={error}
            emptyState={emptyState}
            loadingState={loadingState}
            onRetry={onRetry}
          />
        </table>
      </div>

      {/* Pagination */}
      <TablePagination
        page={pagination.pageIndex + 1}
        pageSize={pagination.pageSize}
        totalRows={totalRows}
        totalPages={pageCount}
        pageSizeOptions={pageSizeOptions}
        onPageChange={(page) => {
          handlePaginationChange({ pageIndex: page - 1, pageSize: pagination.pageSize });
        }}
        onPageSizeChange={(size) => {
          handlePaginationChange({ pageIndex: 0, pageSize: size });
        }}
      />
    </div>
  );
};
