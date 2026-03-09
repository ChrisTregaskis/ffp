interface TableLoadingProps {
  /** Number of skeleton rows to display */
  rowCount?: number;
  /** Number of columns for skeleton cells */
  columnCount: number;
}

/**
 * Skeleton loading state for table body.
 * Renders animated placeholder rows while data is being fetched.
 */
export const TableLoading: React.FC<TableLoadingProps> = ({ rowCount = 5, columnCount }) => (
  <>
    {Array.from({ length: rowCount }).map((_, rowIndex) => (
      <tr key={rowIndex} className="border-b border-muted">
        {Array.from({ length: columnCount }).map((_, colIndex) => (
          <td key={colIndex} className="px-4 py-3">
            <div className="h-4 animate-pulse rounded bg-muted [animation-duration:1.5s]" />
          </td>
        ))}
      </tr>
    ))}
  </>
);
