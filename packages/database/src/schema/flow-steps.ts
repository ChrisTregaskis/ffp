import {
  pgTable,
  uuid,
  integer,
  boolean,
  timestamp,
  jsonb,
  index,
  pgEnum,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';

import { FLOW_STEP_TYPES } from '../constants/flow.constants';
import { assessmentFlows } from './assessment-flows';
import { assessmentTemplates } from './assessment-templates';

import type { FlowStepConfig } from '../constants/flow.constants';
import type { NextStepRule } from '../constants/branching.constants';

/**
 * Flow step type enum
 *
 * Uses shared constants from @ffp/database/constants/flow.constants.ts
 * to ensure synchronisation with Zod schemas in @ffp/core.
 */
export const flowStepTypeEnum = pgEnum('flow_step_type', [...FLOW_STEP_TYPES]);

/**
 * Flow steps table definition
 *
 * Normalised table for assessment flow steps, replacing the JSONB `steps`
 * column on assessment_flows.
 *
 * **Design decisions:**
 * - `order` is a tier/level indicator, NOT unique per flow
 *   (parallel branches can share the same order)
 * - Branching uses `targetStepId` (UUID) for explicit routing
 * - `defaultNextStepId` provides linear fallback when no rules match
 *
 * **No RLS Required:**
 * Flow steps are system content, accessible by all authenticated users.
 */
export const flowSteps = pgTable(
  'flow_steps',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    /** Parent flow this step belongs to */
    flowId: uuid('flow_id')
      .notNull()
      .references(() => assessmentFlows.id, { onDelete: 'cascade' }),

    /**
     * Optional link to assessment template (for 'questions' and 'video-assessment' types).
     * ON DELETE RESTRICT prevents deleting templates that are used in flows.
     */
    templateId: uuid('template_id').references(() => assessmentTemplates.id, {
      onDelete: 'restrict',
    }),

    /**
     * Order/tier indicator within the flow.
     * NOT unique - parallel branches can share the same order.
     * Steps at order N are at the same "level" in the flow.
     */
    order: integer('order').notNull(),

    /** Type of step (intro, questions, transition, etc.) */
    type: flowStepTypeEnum('type').notNull(),

    /** Step-specific configuration (title, description, instructions, etc.) */
    config: jsonb('config').$type<FlowStepConfig>().notNull(),

    /**
     * Conditional navigation rules.
     * Evaluated in priority order when step completes.
     * If no rules match, defaultNextStepId or order+1 fallback is used.
     */
    nextStepRules: jsonb('next_step_rules').$type<NextStepRule[]>(),

    /**
     * Default next step for linear progression (when no rules match).
     * If null, defaults to first active step at order + 1.
     * Self-referencing FK added via raw SQL in migration if needed.
     */
    defaultNextStepId: uuid('default_next_step_id'),

    /** Whether this step is currently active in the flow */
    isActive: boolean('is_active').notNull().default(true),

    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [
    /** Index for fetching all steps for a flow */
    index('idx_flow_steps_flow_id').on(table.flowId),
    /** Composite index for ordering steps within a flow */
    index('idx_flow_steps_flow_order').on(table.flowId, table.order),
  ]
);

/**
 * Relations definition for flow steps
 *
 * - Belongs to one flow (required)
 * - May reference one template (optional, for question/video steps)
 */
export const flowStepsRelations = relations(flowSteps, ({ one }) => ({
  flow: one(assessmentFlows, {
    fields: [flowSteps.flowId],
    references: [assessmentFlows.id],
  }),
  template: one(assessmentTemplates, {
    fields: [flowSteps.templateId],
    references: [assessmentTemplates.id],
  }),
}));

export const insertFlowStepSchema = createInsertSchema(flowSteps);

export const selectFlowStepSchema = createSelectSchema(flowSteps);

export type FlowStepRecord = typeof flowSteps.$inferSelect;

export type NewFlowStep = typeof flowSteps.$inferInsert;
