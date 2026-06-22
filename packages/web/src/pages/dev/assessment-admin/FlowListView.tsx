import { useMemo } from 'react';

import { Button } from '@web/components/button';
import { Icon, Icons } from '@web/components/Icon';
import { Table, TableControls } from '@web/components/table';
import type { RowAction } from '@web/components/table';
import { useApiTable } from '@web/hooks/useApiTable';

import { buildFlowColumns, FLOW_TABLE_FILTERS, toFlowRow, type FlowRow } from './flow-list-columns';
import { usePrototypeStore } from './PrototypeStore';
import { ViewHeader } from './ViewHeader';

/** Browse all flows as a table, with build/scoring/edit/delete row actions (mirrors /admin/templates). */
export const FlowListView: React.FC = () => {
  const { flows, navigate, deleteFlow } = usePrototypeStore();

  const {
    tableState,
    onStateChange,
    search,
    onSearchChange,
    filterValues,
    onFilterChange,
    debouncedSearch,
    debouncedFilters,
    clearAll,
    hasActiveControls,
  } = useApiTable({ defaultPageSize: 10, defaultSort: { id: 'name', desc: false } });

  // Client-side filter → sort → paginate over the in-memory flows (no server here).
  const allRows = useMemo(() => flows.map(toFlowRow), [flows]);

  const filteredRows = useMemo(() => {
    const term = debouncedSearch.trim().toLowerCase();
    // The TableFilterValues type omits undefined, but an unset filter is absent at runtime.
    const statusFilter = (debouncedFilters as Record<string, string | undefined>).isActive;

    return allRows.filter((row) => {
      const matchesSearch =
        term === '' ||
        row.name.toLowerCase().includes(term) ||
        row.description.toLowerCase().includes(term);
      const matchesStatus = !statusFilter || String(row.isActive) === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [allRows, debouncedSearch, debouncedFilters]);

  const sortedRows = useMemo(() => {
    const { sortBy, sortDirection } = tableState;

    if (!sortBy) {
      return filteredRows;
    }

    const factor = sortDirection === 'desc' ? -1 : 1;

    return [...filteredRows].sort((a, b) => {
      const left = a[sortBy];
      const right = b[sortBy];

      if (typeof left === 'number' && typeof right === 'number') {
        return (left - right) * factor;
      }

      return String(left).localeCompare(String(right)) * factor;
    });
  }, [filteredRows, tableState]);

  const pageRows = useMemo(() => {
    const start = (tableState.page - 1) * tableState.pageSize;

    return sortedRows.slice(start, start + tableState.pageSize);
  }, [sortedRows, tableState.page, tableState.pageSize]);

  const rowActions = useMemo(
    (): ((row: FlowRow) => RowAction<FlowRow>[]) => (row) => [
      {
        label: 'Edit details',
        onClick: () => {
          navigate({ name: 'flow-meta', flowId: row.id });
        },
      },
      {
        label: 'Build steps',
        onClick: () => {
          navigate({ name: 'flow-builder', flowId: row.id });
        },
      },
      {
        label: 'Scoring',
        onClick: () => {
          navigate({ name: 'scoring', flowId: row.id });
        },
      },
      {
        label: 'Delete',
        onClick: () => {
          deleteFlow(row.id);
        },
        variant: 'danger',
      },
    ],
    [navigate, deleteFlow]
  );

  const columns = useMemo(() => buildFlowColumns(rowActions), [rowActions]);

  return (
    <div>
      <ViewHeader
        title="Assessment flows"
        subtitle="Each flow is a sequence of steps that produces a tailored programme."
        actions={
          <Button
            variant="primary"
            size="md"
            icon={<Icon name={Icons.PLUS} styleProps={{ size: 'sm', colour: 'currentColor' }} />}
            onClick={() => {
              navigate({ name: 'flow-meta', flowId: 'new' });
            }}
          >
            New flow
          </Button>
        }
      />

      <Table<FlowRow>
        tableId="prototype-flows"
        data={pageRows}
        columns={columns}
        totalRows={sortedRows.length}
        isLoading={false}
        error={null}
        onStateChange={onStateChange}
        defaultSort={{ id: 'name', desc: false }}
        getRowId={(row) => row.id}
        renderControls={(cols) => (
          <TableControls
            search={search}
            onSearchChange={onSearchChange}
            searchPlaceholder="Search flows by name…"
            filters={FLOW_TABLE_FILTERS}
            filterValues={filterValues}
            onFilterChange={onFilterChange}
            columns={cols}
            onClearAll={clearAll}
            hasActiveControls={hasActiveControls}
          />
        )}
      />
    </div>
  );
};
