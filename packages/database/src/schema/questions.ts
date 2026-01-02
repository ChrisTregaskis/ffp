import {
  pgTable,
  uuid,
  varchar,
  text,
  boolean,
  timestamp,
  jsonb,
  index,
  pgEnum,
} from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { QUESTION_TYPES, SCORE_DIMENSIONS } from '../constants/question.constants';
import type { QuestionOption, QuestionValidation } from '../types';

/**
 * Uses shared constants from @ffp/database/constants/question.constants.ts
 * to ensure synchronisation with Zod schemas in @ffp/core.
 */
export const questionTypeEnum = pgEnum('question_type', [...QUESTION_TYPES]);
export const scoreDimensionEnum = pgEnum('score_dimension', [...SCORE_DIMENSIONS]);

/**
 * Questions table definition
 *
 * **No RLS Required:**
 * Questions are system content accessible by all authenticated users,
 * similar to assessment_templates.
 *
 * **Indexes optimised for common queries:**
 * - slug: Unique human-readable identifier lookups
 * - type: Filter by question type
 * - is_active: Filter active questions
 */
export const questions = pgTable(
  'questions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    /** Human-readable identifier (e.g., 'goal-primary', 'pain-level') */
    slug: varchar('slug', { length: 100 }).notNull().unique(),
    /** Type of question determines UI and validation */
    type: questionTypeEnum('type').notNull(),
    /** The question text displayed to users */
    questionText: text('question_text').notNull(),
    /** Optional description or help text for the question */
    description: text('description'),
    /** Answer options for choice-based questions (single-choice, multi-choice) */
    options: jsonb('options').$type<QuestionOption[]>(),
    /** Validation rules for the question */
    validation: jsonb('validation').$type<QuestionValidation>(),
    /** Reference to video for video-response type questions */
    videoId: uuid('video_id'),
    /** Score dimension this question contributes to (nullable for non-scored questions) */
    scoreDimension: scoreDimensionEnum('score_dimension'),
    /** Whether this question is currently active and available for use */
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [
    index('idx_questions_slug').on(table.slug),
    index('idx_questions_type').on(table.type),
    index('idx_questions_is_active').on(table.isActive),
  ]
);

// Zod schema for inserting a question
export const insertQuestionSchema = createInsertSchema(questions);

// Zod schema for selecting a question
export const selectQuestionSchema = createSelectSchema(questions);

export type QuestionRecord = typeof questions.$inferSelect;

export type NewQuestion = typeof questions.$inferInsert;
