import {
  pgTable,
  uuid,
  varchar,
  text,
  integer,
  boolean,
  timestamp,
  jsonb,
  index,
} from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { relations } from 'drizzle-orm';

import { users } from './users';

/**
 * JSONB column types for assessment templates
 *
 * These types mirror the Zod schemas in @ffp/core but are defined locally
 * to avoid circular dependencies between database and core packages.
 * The Zod schemas in @ffp/core are the source of truth for runtime validation.
 */

type QuestionType =
  | 'single-choice'
  | 'multi-choice'
  | 'numeric'
  | 'text'
  | 'scale'
  | 'video-response';
type ScoreDimension = 'strength' | 'balance' | 'mobility' | 'pain' | 'general';

interface QuestionOption {
  value: string;
  label: string;
  score?: number;
}

interface QuestionValidation {
  required?: boolean;
  min?: number;
  max?: number;
  pattern?: string;
  customError?: string;
}

interface AssessmentQuestion {
  id: string;
  type: QuestionType;
  question: string;
  description?: string;
  options?: QuestionOption[];
  validation?: QuestionValidation;
  videoId?: string;
  scoreDimension?: ScoreDimension;
}

type ComparisonOperator = 'lt' | 'lte' | 'gt' | 'gte' | 'eq';
type LogicalOperator = 'and' | 'or';

interface RiskThresholds {
  low: number;
  moderate: number;
}

interface DimensionConfig {
  name: ScoreDimension;
  questionIds: string[];
  maxScore: number;
  weight?: number;
  riskThresholds?: RiskThresholds;
}

interface ProgramMappingCondition {
  dimension: ScoreDimension;
  operator: ComparisonOperator;
  value: number;
}

interface ProgramMapping {
  conditions: ProgramMappingCondition[];
  operator?: LogicalOperator;
  programTemplateId: string;
  priority?: number;
}

interface ScoringConfig {
  dimensions: DimensionConfig[];
  programMappings: ProgramMapping[];
}

/**
 * Assessment templates table definition
 * No RLS - templates are system content accessible by all authenticated users
 */
export const assessmentTemplates = pgTable(
  'assessment_templates',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: varchar('name', { length: 255 }).notNull(),
    description: text('description'),
    version: integer('version').notNull().default(1),
    questions: jsonb('questions').$type<AssessmentQuestion[]>().notNull(),
    scoringConfig: jsonb('scoring_config').$type<ScoringConfig>().notNull(),
    isActive: boolean('is_active').notNull().default(true),
    createdBy: uuid('created_by').references(() => users.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [
    index('idx_assessment_templates_active').on(table.isActive),
    index('idx_assessment_templates_name').on(table.name),
  ]
);

/**
 * Relations definition for assessment templates
 * - May have a creator (user who created the template)
 */
export const assessmentTemplatesRelations = relations(assessmentTemplates, ({ one }) => ({
  createdByUser: one(users, {
    fields: [assessmentTemplates.createdBy],
    references: [users.id],
  }),
}));

export const insertAssessmentTemplateSchema = createInsertSchema(assessmentTemplates);

export const selectAssessmentTemplateSchema = createSelectSchema(assessmentTemplates);

export type AssessmentTemplateRecord = typeof assessmentTemplates.$inferSelect;

export type NewAssessmentTemplate = typeof assessmentTemplates.$inferInsert;
