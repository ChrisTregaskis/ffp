import { Button } from '@web/components/button';
import { Text } from '@web/components/text';

interface TableErrorProps {
  /** Number of columns to span */
  columnCount: number;
  /** Error message to display */
  message?: string;
  /** Retry callback */
  onRetry?: () => void;
}

/**
 * Error state for table body.
 * Renders an error message with an optional retry button.
 */
export const TableError: React.FC<TableErrorProps> = ({
  columnCount,
  message = 'Failed to load data.',
  onRetry,
}) => (
  <tr>
    <td colSpan={columnCount} className="px-4 py-12 text-center">
      <Text as="p" styleProps={{ colour: 'destructive', size: 'sm' }}>
        {message}
      </Text>
      {onRetry && (
        <div className="mt-3">
          <Button variant="secondary" size="sm" onClick={onRetry}>
            Try again
          </Button>
        </div>
      )}
    </td>
  </tr>
);
