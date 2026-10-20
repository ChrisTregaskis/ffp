import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { StatusCell } from './StatusCell';

import type { StatusConfig } from '../types';
import type { CellContext } from '@tanstack/react-table';

const STATUS_MAP: Partial<Record<string, StatusConfig>> = {
  active: { label: 'Active', colour: 'success' },
  inactive: { label: 'Inactive', colour: 'grey' },
  archived: { label: 'Archived', colour: 'amber' },
  odd: { label: 'Odd', colour: 'not-a-colour' },
};

const cellFor = (value: string | null): CellContext<unknown, unknown> =>
  ({ getValue: () => value }) as unknown as CellContext<unknown, unknown>;

const renderCell = (value: string | null): HTMLElement =>
  render(<>{StatusCell({ info: cellFor(value), statusMap: STATUS_MAP })}</>).container;

describe('StatusCell', () => {
  it('maps a colour name, and its aliases, onto a badge', () => {
    expect(renderCell('active').firstElementChild?.className).toContain('bg-success text-white');
    expect(renderCell('inactive').firstElementChild?.className).toContain(
      'bg-muted text-muted-foreground'
    );
    expect(renderCell('archived').firstElementChild?.className).toContain('bg-warning text-white');
  });

  it('falls back to the muted badge for an unknown colour', () => {
    expect(renderCell('odd').firstElementChild?.className).toContain(
      'bg-muted text-muted-foreground'
    );
  });

  it('shows the raw value when unmapped, and a dash when empty', () => {
    expect(renderCell('pending').textContent).toBe('pending');
    expect(renderCell(null).textContent).toBe('-');
  });
});
