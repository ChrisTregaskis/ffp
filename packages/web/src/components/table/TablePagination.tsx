import { Button } from '@web/components/button';
import { Text } from '@web/components/text';

import { PageSizeSelect } from './PageSizeSelect';

interface TablePaginationProps {
  /** Current page (1-indexed) */
  page: number;
  /** Current page size */
  pageSize: number;
  /** Total number of rows across all pages */
  totalRows: number;
  /** Total number of pages */
  totalPages: number;
  /** Available page size options */
  pageSizeOptions: number[];
  /** Called when page changes */
  onPageChange: (page: number) => void;
  /** Called when page size changes */
  onPageSizeChange: (pageSize: number) => void;
}

/**
 * Generates the page numbers to display with sliding window.
 * Shows current page ± 2 with first/last page shortcuts.
 */
const getPageNumbers = (currentPage: number, totalPages: number): (number | '...')[] => {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const pages: (number | '...')[] = [];
  const windowStart = Math.max(2, currentPage - 1);
  const windowEnd = Math.min(totalPages - 1, currentPage + 1);

  pages.push(1);

  if (windowStart > 2) {
    pages.push('...');
  }

  for (let i = windowStart; i <= windowEnd; i++) {
    pages.push(i);
  }

  if (windowEnd < totalPages - 1) {
    pages.push('...');
  }

  if (totalPages > 1) {
    pages.push(totalPages);
  }

  return pages;
};

/**
 * Pagination controls for the table.
 * Shows results summary, page navigation, and page size selector.
 */
export const TablePagination: React.FC<TablePaginationProps> = ({
  page,
  pageSize,
  totalRows,
  totalPages,
  pageSizeOptions,
  onPageChange,
  onPageSizeChange,
}) => {
  if (totalRows === 0) {
    return null;
  }

  const startRow = (page - 1) * pageSize + 1;
  const endRow = Math.min(page * pageSize, totalRows);
  const pageNumbers = getPageNumbers(page, totalPages);

  return (
    <div className="flex flex-col items-center justify-between gap-3 px-4 py-3 sm:flex-row">
      {/* Results summary */}
      <Text as="span" styleProps={{ size: 'sm', colour: 'muted-foreground' }}>
        Showing {startRow}–{endRow} of {totalRows} results
      </Text>

      {/* Page navigation */}
      <nav className="flex items-center gap-1" aria-label="Pagination">
        {/* Previous */}
        <Button
          variant="ghost"
          size="sm"
          disabled={page <= 1}
          onClick={() => {
            onPageChange(page - 1);
          }}
          aria-label="Previous page"
          className="w-8 px-0"
        >
          &#8249;
        </Button>

        {/* Page numbers */}
        {pageNumbers.map((pageNum, index) =>
          pageNum === '...' ? (
            <span
              key={`ellipsis-${String(index)}`}
              className="inline-flex h-8 w-8 items-center justify-center text-sm text-muted-foreground"
            >
              ...
            </span>
          ) : (
            <Button
              key={pageNum}
              variant={pageNum === page ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => {
                onPageChange(pageNum);
              }}
              aria-label={`Page ${String(pageNum)}`}
              aria-current={pageNum === page ? 'page' : undefined}
              className={`w-8 px-0 ${pageNum === page ? 'font-semibold' : ''}`}
            >
              {pageNum}
            </Button>
          )
        )}

        {/* Next */}
        <Button
          variant="ghost"
          size="sm"
          disabled={page >= totalPages}
          onClick={() => {
            onPageChange(page + 1);
          }}
          aria-label="Next page"
          className="w-8 px-0"
        >
          &#8250;
        </Button>
      </nav>

      {/* Page size selector */}
      <PageSizeSelect
        pageSize={pageSize}
        pageSizeOptions={pageSizeOptions}
        onPageSizeChange={onPageSizeChange}
      />
    </div>
  );
};
