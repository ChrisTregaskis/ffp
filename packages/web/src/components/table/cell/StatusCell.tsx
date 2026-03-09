import type { StatusConfig } from '../types';
import type { CellContext } from '@tanstack/react-table';
import type { ReactNode } from 'react';

/**
 * Status colour map — maps colour names to Tailwind background + text classes.
 * Uses FFP theme colours for consistency.
 */
const STATUS_COLOUR_MAP: Record<string, { bg: string; text: string }> = {
  success: { bg: 'bg-success', text: 'text-white' },
  warning: { bg: 'bg-warning', text: 'text-white' },
  destructive: { bg: 'bg-destructive', text: 'text-white' },
  primary: { bg: 'bg-primary', text: 'text-white' },
  info: { bg: 'bg-info', text: 'text-white' },
  muted: { bg: 'bg-muted', text: 'text-muted-foreground' },
  grey: { bg: 'bg-muted', text: 'text-muted-foreground' },
  amber: { bg: 'bg-warning', text: 'text-white' },
  green: { bg: 'bg-success', text: 'text-white' },
};

const getStatusClasses = (colour: string): { bg: string; text: string } =>
  STATUS_COLOUR_MAP[colour] ?? STATUS_COLOUR_MAP.muted;

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

  const { bg, text } = getStatusClasses(config.colour);

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${bg} ${text}`}
    >
      {config.label}
    </span>
  );
};
