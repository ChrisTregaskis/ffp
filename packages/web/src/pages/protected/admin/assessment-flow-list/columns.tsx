import type { AssessmentFlowListItem } from '@ffp/core';

import { createColumns } from '@web/components/table';
import type { RowAction } from '@web/components/table';

import { ASSESSMENT_FLOW_STATUS_MAP } from './constants';

import type { ColumnDef } from '@tanstack/react-table';

/** Row type for the assessment flow list — adds a computed status string for StatusCell */
export type AssessmentFlowRow = AssessmentFlowListItem & { status: string } & Record<
    string,
    unknown
  >;

/** Maps an API list item to its table row with a computed status field */
export const toAssessmentFlowRow = (flow: AssessmentFlowListItem): AssessmentFlowRow => ({
  ...flow,
  status: flow.isActive ? 'active' : 'inactive',
});

const columns = createColumns<AssessmentFlowRow>();

/**
 * Builds column definitions for the assessment flow list table.
 * Actions are injected by the page component (navigation + mutations).
 */
export const buildAssessmentFlowColumns = (
  actions:
    | RowAction<AssessmentFlowRow>[]
    | ((row: AssessmentFlowRow) => RowAction<AssessmentFlowRow>[])
): ColumnDef<AssessmentFlowRow>[] => [
  columns.text('name', { label: 'Name', sortable: true }),
  columns.text('description', { label: 'Description' }),
  columns.number('stepCount', { label: 'Steps' }),
  columns.status('status', { label: 'Status', statusMap: ASSESSMENT_FLOW_STATUS_MAP }),
  columns.actions({ actions }),
];
