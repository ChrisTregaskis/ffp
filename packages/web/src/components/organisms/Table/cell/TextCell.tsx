import type { CellContext } from '@tanstack/react-table';
import type { ReactNode } from 'react';

interface TextCellProps<TData> {
  info: CellContext<TData, unknown>;
  customCell?: (value: unknown, row: TData) => ReactNode;
}

export const TextCell = <TData,>({ info, customCell }: TextCellProps<TData>): ReactNode => {
  if (customCell) {
    return customCell(info.getValue(), info.row.original);
  }

  const val = info.getValue();

  return val != null ? String(val) : '-';
};
