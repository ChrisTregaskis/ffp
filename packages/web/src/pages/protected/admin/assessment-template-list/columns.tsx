import type { AssessmentTemplateListItem } from '@ffp/core';

import { ACTIVE_STATUS_MAP, createColumns, toActiveStatus } from '@web/components/organisms';
import type { RowAction } from '@web/components/organisms';

import type { ColumnDef } from '@tanstack/react-table';

/** Row type for the assessment template list — adds a computed status string for StatusCell */
export type AssessmentTemplateRow = AssessmentTemplateListItem & { status: string } & Record<
    string,
    unknown
  >;

/** Maps an API list item to its table row with a computed status field */
export const toAssessmentTemplateRow = (
  template: AssessmentTemplateListItem
): AssessmentTemplateRow => ({
  ...template,
  status: toActiveStatus(template.isActive),
});

const columns = createColumns<AssessmentTemplateRow>();

/**
 * Builds column definitions for the assessment template list table.
 * Actions are injected by the page component (navigation + mutations).
 */
export const buildAssessmentTemplateColumns = (
  actions:
    | RowAction<AssessmentTemplateRow>[]
    | ((row: AssessmentTemplateRow) => RowAction<AssessmentTemplateRow>[])
): ColumnDef<AssessmentTemplateRow>[] => [
  columns.text('name', { label: 'Name', sortable: true }),
  columns.text('description', { label: 'Description' }),
  columns.number('questionCount', { label: 'Questions' }),
  columns.number('flowCount', { label: 'Used in flows' }),
  columns.status('status', { label: 'Status', statusMap: ACTIVE_STATUS_MAP }),
  columns.actions({ actions }),
];
