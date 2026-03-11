import type { Column, ColumnDef } from '@tanstack/react-table';
import type { ReactNode } from 'react';

export interface TableState {
  page: number;
  pageSize: number;
  sortBy?: string;
  sortDirection: 'asc' | 'desc';
}

export interface RowAction<TData> {
  /** Display label (used in tooltip) */
  label: string;
  /** Icon component (e.g., PencilSquareIcon) */
  icon?: React.ComponentType<{ className?: string }>;
  /** Click handler — receives the row data */
  onClick: (row: TData) => void;
  /** Visual variant */
  variant?: 'default' | 'danger';
  /** Conditionally hide the action */
  hidden?: (row: TData) => boolean;
  /** Conditionally disable the action */
  disabled?: (row: TData) => boolean;
}

export interface BaseColumnOptions {
  /** Display label for the column header and visibility toggle */
  label: string;
  /** Whether the column is sortable */
  sortable?: boolean;
  /** Whether the column can be hidden via visibility toggle (default: true) */
  enableHiding?: boolean;
  /** Text alignment within the column @default 'left' */
  align?: 'left' | 'center' | 'right';
}

// Status map entry for the status column helper.
export interface StatusConfig {
  /** Display label */
  label: string;
  /** Theme colour name (e.g., 'success', 'warning', 'muted') */
  colour: string;
}

export interface TableProps<TData> {
  /** Unique identifier for the table instance */
  tableId: string;
  /** Row data for the current page */
  data: TData[];
  /** Column definitions (from column helper factory) */
  columns: ColumnDef<TData>[];
  /** Total row count across all pages (for pagination) */
  totalRows: number;
  /** Loading state */
  isLoading: boolean;
  /** Error message, if any */
  error?: string | null;
  /** Called when pagination or sorting changes */
  onStateChange: (state: TableState) => void;
  /** Callback to retry after error */
  onRetry?: () => void;
  /** Default page size @default 10 */
  defaultPageSize?: number;
  /** Default sort column and direction */
  defaultSort?: { id: string; desc: boolean };
  /** Page size options @default [10, 20, 50] */
  pageSizeOptions?: number[];
  /** Custom empty state content */
  emptyState?: ReactNode;
  /** Custom loading state content */
  loadingState?: ReactNode;
  /** Default column visibility */
  defaultColumnVisibility?: Record<string, boolean>;
  /** Row ID accessor — defaults to (row) => row.id */
  getRowId?: (row: TData) => string;
  /** Render function for controls (search, filters, column visibility) above the table */
  renderControls?: (columns: Column<TData>[]) => ReactNode;
}
