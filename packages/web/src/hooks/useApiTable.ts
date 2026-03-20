import { useState, useMemo, useCallback, useRef, useEffect } from 'react';

import type { PaginationInput } from '@ffp/core';

import type { TableFilterValues } from '@web/components/table/TableControls';
import type { TableState } from '@web/components/table/types';

interface UseApiTableOptions {
  /** Default page size @default 10 */
  defaultPageSize?: number;
  /** Default sort column and direction */
  defaultSort?: { id: string; desc: boolean };
  /** Default filter values applied on initial load */
  defaultFilters?: TableFilterValues;
}

interface UseApiTableReturn {
  /** Current table state — pass to Table's onStateChange */
  tableState: TableState;
  /** Callback — pass to Table's onStateChange */
  onStateChange: (state: TableState) => void;
  /** Debounced query params ready for API call */
  queryParams: PaginationInput;
  /** Current search value (immediate, for controlled input) */
  search: string;
  /** Search change handler */
  onSearchChange: (value: string) => void;
  /** Current filter values (immediate, for controlled selects) */
  filterValues: TableFilterValues;
  /** Filter change handler */
  onFilterChange: (key: string, value: string | number) => void;
  /** Debounced search value for API calls */
  debouncedSearch: string;
  /** Debounced filter values for API calls */
  debouncedFilters: TableFilterValues;
  /** Reset search, filters, and page to defaults */
  clearAll: () => void;
  /** Whether any search or filter values are active */
  hasActiveControls: boolean;
}

const DEBOUNCE_MS = 300;

/**
 * Bridges Table component state with TanStack Query.
 *
 * Manages table state, search, and filters via useState, debounces
 * changes (300ms), resets page to 1 on sort/search/filter changes,
 * and memoises queryParams to prevent unnecessary re-fetches.
 */
export const useApiTable = (options: UseApiTableOptions = {}): UseApiTableReturn => {
  const { defaultPageSize = 10, defaultSort, defaultFilters = {} } = options;

  const [tableState, setTableState] = useState<TableState>({
    page: 1,
    pageSize: defaultPageSize,
    sortBy: defaultSort?.id,
    sortDirection: defaultSort?.desc ? 'desc' : 'asc',
  });

  // Search and filter state (immediate values for controlled inputs)
  const [search, setSearch] = useState('');
  const [filterValues, setFilterValues] = useState<TableFilterValues>(defaultFilters);

  // Debounced versions of all state
  const [debouncedState, setDebouncedState] = useState<TableState>(tableState);
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [debouncedFilters, setDebouncedFilters] = useState<TableFilterValues>({});

  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounce all state changes together
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      setDebouncedState(tableState);
      setDebouncedSearch(search);
      setDebouncedFilters(filterValues);
    }, DEBOUNCE_MS);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [tableState, search, filterValues]);

  const onStateChange = useCallback(
    (newState: TableState) => {
      // Reset page to 1 when sort changes
      const sortChanged =
        newState.sortBy !== tableState.sortBy ||
        newState.sortDirection !== tableState.sortDirection;

      setTableState({
        ...newState,
        page: sortChanged ? 1 : newState.page,
      });
    },
    [tableState.sortBy, tableState.sortDirection]
  );

  const onSearchChange = useCallback((value: string) => {
    setSearch(value);
    // Reset to page 1 when search changes
    setTableState((prev) => ({ ...prev, page: 1 }));
  }, []);

  const onFilterChange = useCallback((key: string, value: string | number) => {
    setFilterValues((prev) => ({ ...prev, [key]: value }));
    // Reset to page 1 when filters change
    setTableState((prev) => ({ ...prev, page: 1 }));
  }, []);

  const clearAll = useCallback(() => {
    setSearch('');
    setFilterValues({});
    setTableState((prev) => ({ ...prev, page: 1 }));
  }, []);

  const hasActiveControls = useMemo(
    () => search.length > 0 || Object.values(filterValues).some((v) => v !== ''),
    [search, filterValues]
  );

  // Memoised query params for API calls
  const queryParams: PaginationInput = useMemo(
    () => ({
      page: debouncedState.page,
      pageSize: debouncedState.pageSize,
      sortBy: debouncedState.sortBy,
      sortDirection: debouncedState.sortDirection,
    }),
    [
      debouncedState.page,
      debouncedState.pageSize,
      debouncedState.sortBy,
      debouncedState.sortDirection,
    ]
  );

  return {
    tableState,
    onStateChange,
    queryParams,
    search,
    onSearchChange,
    filterValues,
    onFilterChange,
    debouncedSearch,
    debouncedFilters,
    clearAll,
    hasActiveControls,
  };
};
