import { Icon } from '@web/components/Icon/Icon';
import { Icons } from '@web/components/Icon/types';

interface SortIndicatorProps {
  direction: 'asc' | 'desc' | false;
}

/**
 * Sort direction indicator.
 *
 * - Unsorted: stacked up/down arrows, hidden by default, shown on header hover
 * - Ascending: single up arrow in brand blue
 * - Descending: single down arrow in brand blue
 */
export const SortIndicator: React.FC<SortIndicatorProps> = ({ direction }) => {
  if (direction === 'asc') {
    return (
      <span aria-hidden="true">
        <Icon name={Icons.ARROWUP} styleProps={{ size: 'xs', colour: '#FFFFFF' }} />
      </span>
    );
  }

  if (direction === 'desc') {
    return (
      <span aria-hidden="true">
        <Icon name={Icons.ARROWDOWN} styleProps={{ size: 'xs', colour: '#FFFFFF' }} />
      </span>
    );
  }

  // Unsorted: arrow visible only on header hover via group-hover
  return (
    <span
      className="opacity-0 transition-opacity group-hover/sortable:opacity-50"
      aria-hidden="true"
    >
      <Icon name={Icons.ARROWDOWN} styleProps={{ size: 'xs', colour: '#FFFFFF' }} />
    </span>
  );
};
