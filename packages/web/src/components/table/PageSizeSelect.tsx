import { useMemo } from 'react';

import { Select } from '@web/components/select';

interface PageSizeSelectProps {
  pageSize: number;
  pageSizeOptions: number[];
  onPageSizeChange: (pageSize: number) => void;
}

/**
 * Page size selector for table pagination.
 * Renders a dropdown to choose results per page.
 */
export const PageSizeSelect: React.FC<PageSizeSelectProps> = ({
  pageSize,
  pageSizeOptions,
  onPageSizeChange,
}) => {
  const options = useMemo(
    () => pageSizeOptions.map((size) => ({ label: `${String(size)} per page`, value: size })),
    [pageSizeOptions]
  );

  return (
    <Select
      value={pageSize}
      onChange={(val) => {
        onPageSizeChange(Number(val));
      }}
      options={options}
      ariaLabel="Results per page"
    />
  );
};
