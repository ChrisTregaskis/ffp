import { LoadingSpinner } from '@web/components/LoadingSpinner';

interface TableLoadingProps {
  /** Number of columns for the colspan */
  columnCount: number;
}

/**
 * Loading state for table body.
 * Renders a centred spinner while data is being fetched.
 */
export const TableLoading: React.FC<TableLoadingProps> = ({ columnCount }) => (
  <tr>
    <td colSpan={columnCount} className="py-16">
      <LoadingSpinner size="lg" variant="center" />
    </td>
  </tr>
);
