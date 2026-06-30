import { createColumns } from '@web/components/table';
import type { RowAction } from '@web/components/table';

import type { ColumnDef } from '@tanstack/react-table';

/** A row in the phases table — mirrors the live PhasesPage columns. */
export interface PhaseRow extends Record<string, unknown> {
  phaseId: string;
  order: number;
  name: string;
  weeks: string;
  sessionsLabel: string;
}

const columns = createColumns<PhaseRow>();

/** Columns for the member programme's phases table — Order / Phase / Weeks / Sessions / Actions. */
export const buildPhaseColumns = (
  actions: (row: PhaseRow) => RowAction<PhaseRow>[]
): ColumnDef<PhaseRow>[] => [
  columns.text('order', { label: 'Order' }),
  columns.text('name', { label: 'Phase' }),
  columns.text('weeks', { label: 'Weeks' }),
  columns.text('sessionsLabel', { label: 'Sessions' }),
  columns.actions({ actions }),
];
