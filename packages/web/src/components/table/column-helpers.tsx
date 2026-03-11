import {
  ActionsCell,
  DateCell,
  DurationCell,
  NumberCell,
  StatusCell,
  TagsCell,
  TextCell,
} from './cell';

import type { BaseColumnOptions, RowAction, StatusConfig } from './types';
import type { ColumnDef } from '@tanstack/react-table';
import type { ReactNode } from 'react';

/**
 * Builds common column meta from options.
 */
const buildMeta = (
  options: BaseColumnOptions
): { label: string; sortable: boolean; align: 'left' | 'center' | 'right' } => ({
  label: options.label,
  sortable: options.sortable ?? false,
  align: options.align ?? 'left',
});

interface ColumnHelpers<TData extends Record<string, unknown>> {
  text: (
    accessor: keyof TData & string,
    options: BaseColumnOptions & { cell?: (value: unknown, row: TData) => ReactNode }
  ) => ColumnDef<TData>;
  number: (
    accessor: keyof TData & string,
    options: BaseColumnOptions & { format?: (value: number) => string }
  ) => ColumnDef<TData>;
  date: (
    accessor: keyof TData & string,
    options: BaseColumnOptions & { formatFn?: (value: string | Date) => string }
  ) => ColumnDef<TData>;
  status: (
    accessor: keyof TData & string,
    options: BaseColumnOptions & { statusMap: Partial<Record<string, StatusConfig>> }
  ) => ColumnDef<TData>;
  tags: (
    accessor: keyof TData & string,
    options: Omit<BaseColumnOptions, 'sortable'> & { maxVisible?: number }
  ) => ColumnDef<TData>;
  duration: (accessor: keyof TData & string, options: BaseColumnOptions) => ColumnDef<TData>;
  actions: (options: {
    actions: RowAction<TData>[] | ((row: TData) => RowAction<TData>[]);
  }) => ColumnDef<TData>;
}

/**
 * Creates a typed column helper factory for a given data row type.
 *
 * Usage:
 *   const columns = createColumns<VideoRow>();
 *   return [
 *     columns.text('title', { label: 'Title', sortable: true }),
 *     columns.status('status', { label: 'Status', statusMap }),
 *     columns.actions({ actions: [...] }),
 *   ];
 */
export const createColumns = <TData extends Record<string, unknown>>(): ColumnHelpers<TData> => ({
  /**
   * Plain text column.
   */
  text: (
    accessor: keyof TData & string,
    options: BaseColumnOptions & {
      cell?: (value: unknown, row: TData) => ReactNode;
    }
  ): ColumnDef<TData> => ({
    id: accessor,
    accessorFn: (row: TData) => row[accessor],
    header: options.label,
    cell: (info) => <TextCell info={info} customCell={options.cell} />,
    enableSorting: options.sortable ?? false,
    enableHiding: options.enableHiding ?? true,
    meta: buildMeta(options),
  }),

  /**
   * Numeric column with optional format function.
   */
  number: (
    accessor: keyof TData & string,
    options: BaseColumnOptions & {
      format?: (value: number) => string;
    }
  ): ColumnDef<TData> => ({
    id: accessor,
    accessorFn: (row: TData) => row[accessor],
    header: options.label,
    cell: (info) => <NumberCell info={info} format={options.format} />,
    enableSorting: options.sortable ?? false,
    enableHiding: options.enableHiding ?? true,
    meta: buildMeta(options),
  }),

  /**
   * Date/time column with Intl.DateTimeFormat formatting.
   */
  date: (
    accessor: keyof TData & string,
    options: BaseColumnOptions & {
      formatFn?: (value: string | Date) => string;
    }
  ): ColumnDef<TData> => ({
    id: accessor,
    accessorFn: (row: TData) => row[accessor],
    header: options.label,
    cell: (info) => <DateCell info={info} formatFn={options.formatFn} />,
    enableSorting: options.sortable ?? false,
    enableHiding: options.enableHiding ?? true,
    meta: buildMeta(options),
  }),

  /**
   * Status badge column with colour-coded pills.
   */
  status: (
    accessor: keyof TData & string,
    options: BaseColumnOptions & {
      statusMap: Partial<Record<string, StatusConfig>>;
    }
  ): ColumnDef<TData> => ({
    id: accessor,
    accessorFn: (row: TData) => row[accessor],
    header: options.label,
    cell: (info) => <StatusCell info={info} statusMap={options.statusMap} />,
    enableSorting: options.sortable ?? false,
    enableHiding: options.enableHiding ?? true,
    meta: buildMeta(options),
  }),

  /**
   * Array/tags column — renders items as small badges with overflow.
   */
  tags: (
    accessor: keyof TData & string,
    options: Omit<BaseColumnOptions, 'sortable'> & {
      maxVisible?: number;
    }
  ): ColumnDef<TData> => ({
    id: accessor,
    accessorFn: (row: TData) => row[accessor],
    header: options.label,
    cell: (info) => <TagsCell info={info} maxVisible={options.maxVisible} />,
    enableSorting: false,
    enableHiding: options.enableHiding ?? true,
    meta: { label: options.label, sortable: false, align: options.align ?? 'left' },
  }),

  /**
   * Duration column — renders seconds as M:SS.
   */
  duration: (accessor: keyof TData & string, options: BaseColumnOptions): ColumnDef<TData> => ({
    id: accessor,
    accessorFn: (row: TData) => row[accessor],
    header: options.label,
    cell: (info) => <DurationCell info={info} />,
    enableSorting: options.sortable ?? false,
    enableHiding: options.enableHiding ?? true,
    meta: buildMeta(options),
  }),

  /**
   * Row actions column — renders a dropdown menu button with action items.
   */
  actions: (options: {
    actions: RowAction<TData>[] | ((row: TData) => RowAction<TData>[]);
    /** Dropdown button label @default 'Actions' */
    label?: string;
  }): ColumnDef<TData> => ({
    id: '_actions',
    header: '',
    cell: (info) => <ActionsCell info={info} actions={options.actions} label={options.label} />,
    enableSorting: false,
    enableHiding: false,
    meta: { label: 'Actions', sortable: false, align: 'right' as const },
  }),
});
