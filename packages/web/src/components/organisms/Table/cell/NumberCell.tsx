import type { CellContext } from '@tanstack/react-table';
import type { ReactNode } from 'react';

interface NumberCellProps<TData> {
  info: CellContext<TData, unknown>;
  format?: (value: number) => string;
}

export const NumberCell = <TData,>({ info, format }: NumberCellProps<TData>): ReactNode => {
  const value = info.getValue() as number | null | undefined;

  if (value == null) {
    return '-';
  }

  return format ? format(value) : String(value);
};
