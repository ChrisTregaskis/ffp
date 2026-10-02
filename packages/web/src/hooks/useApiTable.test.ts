import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { useApiTable } from './useApiTable';

describe('useApiTable control flags', () => {
  it('reports neither flag on a list with no defaults and nothing entered', () => {
    const { result } = renderHook(() => useApiTable());

    expect(result.current.hasActiveControls).toBe(false);
    expect(result.current.hasNonDefaultControls).toBe(false);
  });

  // The defect this fixes: a list seeded with a default filter rendered its
  // "No matching…" state on first paint, hiding the create call to action on a
  // page nobody had filtered.
  it('does not count a seeded default filter as narrowing', () => {
    const { result } = renderHook(() => useApiTable({ defaultFilters: { isActive: 'true' } }));

    expect(result.current.hasNonDefaultControls).toBe(false);
    expect(result.current.hasActiveControls).toBe(true);
  });

  it('counts a filter moved away from its default as narrowing', () => {
    const { result } = renderHook(() => useApiTable({ defaultFilters: { isActive: 'true' } }));

    act(() => {
      result.current.onFilterChange('isActive', 'false');
    });

    expect(result.current.hasNonDefaultControls).toBe(true);
    expect(result.current.hasActiveControls).toBe(true);
  });

  it('counts a filter with no default as narrowing once set', () => {
    const { result } = renderHook(() => useApiTable());

    act(() => {
      result.current.onFilterChange('difficulty', 'beginner');
    });

    expect(result.current.hasNonDefaultControls).toBe(true);
    expect(result.current.hasActiveControls).toBe(true);
  });

  it('counts a search term as narrowing whatever the filters say', () => {
    const { result } = renderHook(() => useApiTable({ defaultFilters: { isActive: 'true' } }));

    act(() => {
      result.current.onSearchChange('knee');
    });

    expect(result.current.hasNonDefaultControls).toBe(true);
  });

  it('reports nothing narrowing after clearAll, which clears rather than restores', () => {
    const { result } = renderHook(() => useApiTable({ defaultFilters: { isActive: 'true' } }));

    act(() => {
      result.current.onSearchChange('knee');
    });
    act(() => {
      result.current.clearAll();
    });

    expect(result.current.filterValues).toEqual({});
    expect(result.current.hasActiveControls).toBe(false);
    expect(result.current.hasNonDefaultControls).toBe(false);
  });

  // A caller passes defaultFilters as an inline literal, so a fresh object arrives on
  // every render; the comparison must keep using the one that seeded the state.
  it('keeps comparing against the defaults it was first given', () => {
    const { result, rerender } = renderHook(
      ({ defaults }) => useApiTable({ defaultFilters: defaults }),
      { initialProps: { defaults: { isActive: 'true' } } }
    );

    rerender({ defaults: { isActive: 'true' } });

    expect(result.current.hasNonDefaultControls).toBe(false);
  });
});
