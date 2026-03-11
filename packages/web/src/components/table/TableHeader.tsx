import { flexRender, type HeaderGroup } from '@tanstack/react-table';

import { getAlignJustifyClass, getAlignTextClass } from './alignmentUtils';
import { SortIndicator } from './SortIndicator';

interface TableHeaderProps<TData> {
  /** Header groups from TanStack Table */
  headerGroups: HeaderGroup<TData>[];
}

/**
 * Table header component.
 * Renders column headers with sort indicators for sortable columns.
 */
export const TableHeader = <TData,>({
  headerGroups,
}: TableHeaderProps<TData>): React.ReactElement => (
  <thead className="border-b-2 border-ffp-navy/20 bg-ffp-navy">
    {headerGroups.map((headerGroup) => (
      <tr key={headerGroup.id}>
        {headerGroup.headers.map((header) => {
          const isSortable = header.column.getCanSort();
          const sortDirection = header.column.getIsSorted();
          const meta = header.column.columnDef.meta as
            | { label: string; sortable: boolean; align?: 'left' | 'center' | 'right' }
            | undefined;
          const alignClass = getAlignTextClass(meta?.align);

          return (
            <th
              key={header.id}
              scope="col"
              className={`px-4 py-3 ${alignClass} text-xs font-semibold uppercase tracking-wider text-white ${
                isSortable
                  ? 'group/sortable cursor-pointer select-none transition-colors hover:text-white/80'
                  : ''
              }`}
              style={{ width: header.getSize() !== 150 ? header.getSize() : undefined }}
              onClick={isSortable ? header.column.getToggleSortingHandler() : undefined}
              aria-sort={
                sortDirection === 'asc'
                  ? 'ascending'
                  : sortDirection === 'desc'
                    ? 'descending'
                    : undefined
              }
            >
              <div className={`flex items-center gap-1.5 ${getAlignJustifyClass(meta?.align)}`}>
                {header.isPlaceholder
                  ? null
                  : flexRender(header.column.columnDef.header, header.getContext())}
                {isSortable && meta?.sortable !== false && (
                  <SortIndicator direction={sortDirection} />
                )}
              </div>
            </th>
          );
        })}
      </tr>
    ))}
  </thead>
);
