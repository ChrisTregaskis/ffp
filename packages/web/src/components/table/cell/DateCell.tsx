import { formatDate } from '@web/utils/format';

import type { CellContext } from '@tanstack/react-table';
import type { ReactNode } from 'react';

interface DateCellProps<TData> {
  info: CellContext<TData, unknown>;
  formatFn?: (value: string | Date) => string;
}

export const DateCell = <TData,>({ info, formatFn }: DateCellProps<TData>): ReactNode => {
  const value = info.getValue() as string | Date | null | undefined;

  if (value == null) {
    return '-';
  }

  return formatFn ? formatFn(value) : formatDate(value);
};
