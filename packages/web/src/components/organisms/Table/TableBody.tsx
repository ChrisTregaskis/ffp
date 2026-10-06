import { flexRender, type Row, type ColumnDef } from '@tanstack/react-table';

import { getAlignTextClass } from './alignmentUtils';
import { TableEmpty } from './TableEmpty';
import { TableError } from './TableError';
import { TableLoading } from './TableLoading';

import type { ReactNode } from 'react';

interface TableBodyProps<TData> {
  /** Table rows from TanStack Table */
  rows: Row<TData>[];
  /** Column definitions for counting columns */
  columns: ColumnDef<TData>[];
  /** Loading state */
  isLoading: boolean;
  /** Error message */
  error?: string | null;
  /** Custom empty state content */
  emptyState?: ReactNode;
  /** Custom loading state content */
  loadingState?: ReactNode;
  /** Retry callback for error state */
  onRetry?: () => void;
}

/**
 * Table body component.
 * Dispatches to loading, empty, or error states as appropriate.
 */
export const TableBody = <TData,>({
  rows,
  columns,
  isLoading,
  error,
  emptyState,
  loadingState,
  onRetry,
}: TableBodyProps<TData>): React.ReactElement => {
  const columnCount = columns.length;

  if (isLoading) {
    return (
      <tbody>
        {loadingState ? (
          <tr>
            <td colSpan={columnCount}>{loadingState}</td>
          </tr>
        ) : (
          <TableLoading columnCount={columnCount} />
        )}
      </tbody>
    );
  }

  if (error) {
    return (
      <tbody>
        <TableError columnCount={columnCount} message={error} onRetry={onRetry} />
      </tbody>
    );
  }

  if (rows.length === 0) {
    return (
      <tbody>
        <TableEmpty columnCount={columnCount}>{emptyState}</TableEmpty>
      </tbody>
    );
  }

  return (
    <tbody>
      {rows.map((row) => (
        <tr key={row.id} className="border-b border-muted transition-colors hover:bg-muted/20">
          {row.getVisibleCells().map((cell) => {
            const align = (
              cell.column.columnDef.meta as { align?: 'left' | 'center' | 'right' } | undefined
            )?.align;
            const alignClass = getAlignTextClass(align);

            return (
              <td key={cell.id} className={`px-4 py-3 text-sm text-foreground ${alignClass}`}>
                {flexRender(cell.column.columnDef.cell, cell.getContext())}
              </td>
            );
          })}
        </tr>
      ))}
    </tbody>
  );
};
