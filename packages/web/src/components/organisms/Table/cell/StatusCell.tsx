import { Badge } from '@web/components/atoms';
import type { BadgeAppearance, BadgeVariant } from '@web/components/atoms';

import type { StatusConfig } from '../types';
import type { CellContext } from '@tanstack/react-table';
import type { ReactNode } from 'react';

interface StatusBadgeStyle {
  variant: BadgeVariant;
  appearance: BadgeAppearance;
}

const MUTED: StatusBadgeStyle = { variant: 'muted', appearance: 'soft' };

/** Maps a status map's colour name, including the `grey` / `amber` / `green` aliases, to a badge. */
const STATUS_COLOUR_MAP: Record<string, StatusBadgeStyle> = {
  success: { variant: 'success', appearance: 'solid' },
  warning: { variant: 'warning', appearance: 'solid' },
  destructive: { variant: 'destructive', appearance: 'solid' },
  primary: { variant: 'primary', appearance: 'solid' },
  info: { variant: 'info', appearance: 'solid' },
  muted: MUTED,
  grey: MUTED,
  amber: { variant: 'warning', appearance: 'solid' },
  green: { variant: 'success', appearance: 'solid' },
};

interface StatusCellProps<TData> {
  info: CellContext<TData, unknown>;
  statusMap: Partial<Record<string, StatusConfig>>;
}

export const StatusCell = <TData,>({ info, statusMap }: StatusCellProps<TData>): ReactNode => {
  const value = info.getValue() as string | null | undefined;

  if (value == null) {
    return '-';
  }

  const config = statusMap[value];

  if (!config) {
    return value;
  }

  return <Badge label={config.label} {...(STATUS_COLOUR_MAP[config.colour] ?? MUTED)} />;
};
