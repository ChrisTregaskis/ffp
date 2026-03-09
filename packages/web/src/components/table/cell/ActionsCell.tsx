import { DropdownMenu } from '@web/components/dropdown-menu';

import type { RowAction } from '../types';
import type { CellContext } from '@tanstack/react-table';
import type { ReactNode } from 'react';

interface ActionsCellProps<TData> {
  info: CellContext<TData, unknown>;
  actions: RowAction<TData>[] | ((row: TData) => RowAction<TData>[]);
  label?: string;
}

export const ActionsCell = <TData,>({
  info,
  actions,
  label = 'Actions',
}: ActionsCellProps<TData>): ReactNode => {
  const rowActions = typeof actions === 'function' ? actions(info.row.original) : actions;

  const visibleActions = rowActions.filter((action) => !action.hidden?.(info.row.original));

  if (visibleActions.length === 0) {
    return null;
  }

  const menuItems = visibleActions.map((action) => ({
    label: action.label,
    onClick: () => {
      action.onClick(info.row.original);
    },
    variant: action.variant === 'danger' ? ('danger' as const) : ('default' as const),
    disabled: action.disabled?.(info.row.original) ?? false,
    icon: action.icon,
  }));

  return (
    <div className="flex justify-end">
      <DropdownMenu label={label} items={menuItems} size="sm" />
    </div>
  );
};
