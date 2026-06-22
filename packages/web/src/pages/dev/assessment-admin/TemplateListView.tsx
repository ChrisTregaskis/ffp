import { useMemo } from 'react';

import { Button } from '@web/components/button';
import { Icon, Icons } from '@web/components/Icon';
import { Table, TableControls } from '@web/components/table';
import type { RowAction } from '@web/components/table';
import { useApiTable } from '@web/hooks/useApiTable';

import { usePrototypeStore } from './PrototypeStore';
import { buildTemplateColumns, toTemplateRow, type TemplateRow } from './template-list-columns';
import { ViewHeader } from './ViewHeader';

/** Browse all templates as a table; click a row to manage its questions (mirrors the flow list). */
export const TemplateListView: React.FC = () => {
  const { templates, navigate, createTemplate, deleteTemplate } = usePrototypeStore();

  const {
    tableState,
    onStateChange,
    search,
    onSearchChange,
    debouncedSearch,
    clearAll,
    hasActiveControls,
  } = useApiTable({ defaultPageSize: 10, defaultSort: { id: 'name', desc: false } });

  const allRows = useMemo(() => templates.map(toTemplateRow), [templates]);

  const filteredRows = useMemo(() => {
    const term = debouncedSearch.trim().toLowerCase();

    if (term === '') {
      return allRows;
    }

    return allRows.filter((row) => row.name.toLowerCase().includes(term));
  }, [allRows, debouncedSearch]);

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
    (): ((row: TemplateRow) => RowAction<TemplateRow>[]) => (row) => [
      {
        label: 'Edit',
        onClick: () => {
          navigate({ name: 'template-edit', templateId: row.id });
        },
      },
      {
        label: 'Delete',
        onClick: () => {
          deleteTemplate(row.id);
        },
        variant: 'danger',
      },
    ],
    [navigate, deleteTemplate]
  );

  const columns = useMemo(() => buildTemplateColumns(rowActions), [rowActions]);

  const handleCreate = (): void => {
    const created = createTemplate('Untitled template');
    navigate({ name: 'template-edit', templateId: created.id });
  };

  return (
    <div>
      <ViewHeader
        title="Templates"
        subtitle="Reusable question sets. Flow steps link to a template; open one to manage its questions."
        actions={
          <Button
            variant="primary"
            size="md"
            icon={<Icon name={Icons.PLUS} styleProps={{ size: 'sm', colour: 'currentColor' }} />}
            onClick={handleCreate}
          >
            New template
          </Button>
        }
      />

      <Table<TemplateRow>
        tableId="prototype-templates"
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
            searchPlaceholder="Search templates by name…"
            columns={cols}
            onClearAll={clearAll}
            hasActiveControls={hasActiveControls}
          />
        )}
      />
    </div>
  );
};
