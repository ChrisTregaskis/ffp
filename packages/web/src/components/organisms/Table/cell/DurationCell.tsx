import { formatDuration } from '@web/utils/format';

import type { CellContext } from '@tanstack/react-table';
import type { ReactNode } from 'react';

interface DurationCellProps<TData> {
  info: CellContext<TData, unknown>;
}

export const DurationCell = <TData,>({ info }: DurationCellProps<TData>): ReactNode =>
  formatDuration(info.getValue() as number | null | undefined);
