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

/**
 * Assessment flows table definition
 *
 * Stores configurable assessment journeys that define the step sequence
 * users experience (intro → questions → transition → video → results).
 *
 * No RLS required - flows are system-managed content accessible by all authenticated users.
 */
export const assessmentFlows = pgTable(
  'assessment_flows',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: varchar('name', { length: 255 }).notNull(),
    description: text('description'),
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
