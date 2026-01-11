import {
  pgTable,
  uuid,
  varchar,
  text,
  boolean,
  timestamp,
  jsonb,
  index,
} from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';

import type { FlowStep } from '../constants';
import type { ScoringConfig } from '../types';

/**
 * Assessment flows table definition
 *
 * Stores configurable assessment journeys that define the step sequence
 * users experience (intro → questions → transition → video → results).
 *
 * Flow owns the scoring configuration that combines dimensions from all templates
 * in the flow to produce a single holistic programme recommendation.
 *
 * **Relations:**
 * - Has many flowSteps (defined in flow-steps.ts to avoid circular imports)
 *
 * No RLS required - flows are system-managed content accessible by all authenticated users.
 */
export const assessmentFlows = pgTable(
  'assessment_flows',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: varchar('name', { length: 255 }).notNull(),
    description: text('description'),

    /**
     * Combined scoring configuration for all dimensions in the flow.
     * Dimensions from all templates (pain, general, strength, balance) are
     * aggregated here to produce a single programme recommendation.
     */
    scoringConfig: jsonb('scoring_config').$type<ScoringConfig>(),

    /**
     * @deprecated Session 2 will normalise this to flow_steps table.
     * Kept for backwards compatibility during migration.
     */
    steps: jsonb('steps').$type<FlowStep[]>().notNull(),

    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [index('idx_assessment_flows_active').on(table.isActive)]
);

export const insertAssessmentFlowSchema = createInsertSchema(assessmentFlows);

export const selectAssessmentFlowSchema = createSelectSchema(assessmentFlows);

export type AssessmentFlowRecord = typeof assessmentFlows.$inferSelect;

export type NewAssessmentFlow = typeof assessmentFlows.$inferInsert;
