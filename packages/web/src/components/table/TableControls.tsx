import { useMemo } from 'react';

import { Button } from '@web/components/button';
import { Panel } from '@web/components/panel';
import { SearchInput } from '@web/components/search';
import { Select } from '@web/components/select';
import type { SelectOption } from '@web/components/select';

import { TableColumnVisibility } from './TableColumnVisibility';

import type { Column } from '@tanstack/react-table';

export interface TableFilterConfig {
  /** Query parameter name */
  key: string;
  /** Placeholder and aria-label text */
  label: string;
  /** Available filter options (excluding "All") */
  options: SelectOption[];
}

export type TableFilterValues = Record<string, string | number>;

export interface TableControlsProps<TData> {
  /** Current search value */
  search: string;
  /** Search change handler */
  onSearchChange: (value: string) => void;
  /** Search placeholder text */
  searchPlaceholder?: string;
  /** Filter dropdown configurations */
  filters?: TableFilterConfig[];
  /** Current filter values */
  filterValues?: TableFilterValues;
  /** Filter change handler */
  onFilterChange?: (key: string, value: string | number) => void;
  /** All table columns (for column visibility toggle) */
  columns: Column<TData>[];
  /** Clear all controls handler */
  onClearAll: () => void;
  /** Whether any controls have active values */
  hasActiveControls?: boolean;
}

/**
 * Search, filter, and column visibility controls for table pages.
 *
 * Renders above the table with left-aligned search + filters
 * and right-aligned Clear All + Columns toggle.
 */
export const TableControls = <TData,>({
  search,
  onSearchChange,
  searchPlaceholder,
  filters,
  filterValues,
  onFilterChange,
  columns,
  onClearAll,
  hasActiveControls = false,
}: TableControlsProps<TData>): React.ReactElement => {
  // Prepend "All {label}" option to each filter's options list
  const filtersWithAll = useMemo(
    () =>
      filters?.map((filter) => ({
        ...filter,
        options: [{ label: `All ${filter.label}`, value: '' }, ...filter.options],
      })),
    [filters]
  );

  return (
    <Panel className="flex flex-wrap items-center gap-2">
      {/* Left side: search + filters */}
      <SearchInput
        value={search}
        onChange={onSearchChange}
        placeholder={searchPlaceholder}
        className="w-full sm:w-56"
      />

      {filtersWithAll?.map((filter) => (
        <Select
          key={filter.key}
          value={filterValues?.[filter.key] ?? ''}
          onChange={(val) => {
            onFilterChange?.(filter.key, val);
          }}
          options={filter.options}
          ariaLabel={filter.label}
          placeholder={filter.label}
          className="w-full sm:w-40"
        />
      ))}

      <Button variant="ghost" size="sm" onClick={onClearAll} disabled={!hasActiveControls}>
        Clear all
      </Button>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Right side: Columns */}
      <TableColumnVisibility columns={columns} />
    </Panel>
  );
};
