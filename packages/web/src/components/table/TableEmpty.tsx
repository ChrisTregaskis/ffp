import { Text } from '@web/components/text';

import type { ReactNode } from 'react';

interface TableEmptyProps {
  /** Number of columns to span */
  columnCount: number;
  /** Custom empty state content */
  children?: ReactNode;
}

/**
 * Empty state for table body.
 * Renders a centred message when there are no rows to display.
 */
export const TableEmpty: React.FC<TableEmptyProps> = ({ columnCount, children }) => (
  <tr>
    <td colSpan={columnCount} className="px-4 py-12 text-center">
      {children ?? (
        <Text as="p" styleProps={{ colour: 'muted-foreground', size: 'sm' }}>
          No results found.
        </Text>
      )}
    </td>
  </tr>
);
