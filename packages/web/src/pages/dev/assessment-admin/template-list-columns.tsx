import { createColumns } from '@web/components/table';
import type { RowAction } from '@web/components/table';

import type { PrototypeTemplate } from './prototype-types';
import type { ColumnDef } from '@tanstack/react-table';

/** Row type for the template list table. */
export type TemplateRow = {
  id: string;
  publicId: string;
  name: string;
  questions: number;
} & Record<string, unknown>;

/** Maps a prototype template to its table row. */
export const toTemplateRow = (template: PrototypeTemplate): TemplateRow => ({
  id: template.id,
  publicId: template.publicId,
  name: template.name,
  questions: template.questionIds.length,
});

const columns = createColumns<TemplateRow>();

/** Builds the template-list column defs; row actions are injected by the page. */
export const buildTemplateColumns = (
  actions: RowAction<TemplateRow>[] | ((row: TemplateRow) => RowAction<TemplateRow>[])
): ColumnDef<TemplateRow>[] => [
  columns.text('name', { label: 'Name', sortable: true }),
  columns.number('questions', { label: 'Questions' }),
  columns.actions({ actions }),
];
