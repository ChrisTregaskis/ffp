import { createColumns } from '@web/components/table';
import type { RowAction, StatusConfig, TableFilterConfig } from '@web/components/table';

import type { PrototypeFlow } from './prototype-types';
import type { ColumnDef } from '@tanstack/react-table';

/** Row type for the flow list table (adds computed counts + status string). */
export type FlowRow = {
  id: string;
  publicId: string;
  name: string;
  description: string;
  isActive: boolean;
  steps: number;
  dimensions: number;
  status: string;
} & Record<string, unknown>;

/** Maps a prototype flow to its table row. */
export const toFlowRow = (flow: PrototypeFlow): FlowRow => ({
  id: flow.id,
  publicId: flow.publicId,
  name: flow.name,
  description: flow.description,
  isActive: flow.isActive,
  steps: flow.steps.length,
  dimensions: flow.scoringConfig.dimensions.length,
  status: flow.isActive ? 'active' : 'draft',
});

export const FLOW_STATUS_MAP: Partial<Record<string, StatusConfig>> = {
  active: { label: 'Active', colour: 'success' },
  draft: { label: 'Draft', colour: 'grey' },
};

export const FLOW_TABLE_FILTERS: TableFilterConfig[] = [
  {
    key: 'isActive',
    label: 'Status',
    options: [
      { label: 'Active', value: 'true' },
      { label: 'Draft', value: 'false' },
    ],
  },
];

const columns = createColumns<FlowRow>();

/** Builds the flow-list column defs; row actions are injected by the page. */
export const buildFlowColumns = (
  actions: RowAction<FlowRow>[] | ((row: FlowRow) => RowAction<FlowRow>[])
): ColumnDef<FlowRow>[] => [
  columns.text('name', { label: 'Name', sortable: true }),
  columns.text('description', { label: 'Description' }),
  columns.number('steps', { label: 'Steps' }),
  columns.number('dimensions', { label: 'Scoring' }),
  columns.status('status', { label: 'Status', statusMap: FLOW_STATUS_MAP }),
  columns.actions({ actions }),
];
