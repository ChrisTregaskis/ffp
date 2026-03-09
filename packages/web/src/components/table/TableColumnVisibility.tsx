import { DropdownMenu } from '@web/components/dropdown-menu';
import { Text } from '@web/components/text';

import type { Column } from '@tanstack/react-table';

interface TableColumnVisibilityProps<TData> {
  /** All columns from the table instance */
  columns: Column<TData>[];
}

/**
 * Column visibility toggle dropdown.
 * Renders a button that opens a dropdown with checkboxes for each hideable column.
 */
export const TableColumnVisibility = <TData,>({
  columns,
}: TableColumnVisibilityProps<TData>): React.ReactElement | null => {
  const hideableColumns = columns.filter((col) => col.getCanHide());

  if (hideableColumns.length === 0) {
    return null;
  }

  return (
    <DropdownMenu
      label="Columns"
      size="sm"
      renderContent={() => (
        <div className="p-2">
          {hideableColumns.map((column) => {
            const meta = column.columnDef.meta as { label: string } | undefined;
            const label = meta?.label ?? column.id;

            return (
              <label
                key={column.id}
                className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-muted/50"
              >
                <input
                  type="checkbox"
                  checked={column.getIsVisible()}
                  onChange={column.getToggleVisibilityHandler()}
                  className="h-4 w-4 rounded border-muted-foreground text-primary focus:ring-primary"
                />
                <Text as="span" styleProps={{ size: 'sm', colour: 'foreground' }}>
                  {label}
                </Text>
              </label>
            );
          })}
        </div>
      )}
    />
  );
};
