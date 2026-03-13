import type { TemplateListResponse } from '@ffp/core';

import { createColumns } from '@web/components/table';
import type { RowAction } from '@web/components/table';

import { TEMPLATE_STATUS_MAP } from './constants';

import type { ColumnDef } from '@tanstack/react-table';

/** Row type for the template list — adds computed status string for StatusCell */
export type TemplateRow = TemplateListResponse & { status: string } & Record<string, unknown>;

/** Maps API response to row type with computed status field */
export const toTemplateRow = (template: TemplateListResponse): TemplateRow => ({
  ...template,
  status: template.isActive ? 'active' : 'inactive',
});

const columns = createColumns<TemplateRow>();

/**
 * Builds column definitions for the programme template list table.
 * Actions are injected by the page component (navigation + mutations).
 */
export const buildTemplateColumns = (
  actions: RowAction<TemplateRow>[] | ((row: TemplateRow) => RowAction<TemplateRow>[])
): ColumnDef<TemplateRow>[] => [
  columns.text('name', { label: 'Name', sortable: true }),
  columns.text('slug', { label: 'Slug' }),
  columns.text('difficulty', { label: 'Difficulty', sortable: true }),
  columns.number('totalPhases', { label: 'Phases' }),
  columns.number('sessionsPerPhase', { label: 'Sessions/Phase' }),
  columns.status('status', { label: 'Status', statusMap: TEMPLATE_STATUS_MAP }),
  columns.date('createdAt', { label: 'Created', sortable: true }),
  columns.actions({ actions }),
];
