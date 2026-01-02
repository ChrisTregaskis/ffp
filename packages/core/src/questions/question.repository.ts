import { eq, inArray, asc } from 'drizzle-orm';

import type { DbClient, QuestionOption, QuestionValidation, ConfigOverrides } from '@ffp/database';
import { questions, templateQuestions } from '@ffp/database/schema';

/**
 * Question with optional template-specific configuration
 *
 * Represents a question as returned by findByTemplateId, including
 * display order and any config overrides from the template.
 */
export interface QuestionWithConfig {
  id: string;
  slug: string;
  type: string;
  questionText: string;
  description: string | null;
  options: QuestionOption[] | null;
  validation: QuestionValidation | null;
  videoId: string | null;
  scoreDimension: string | null;
  isActive: boolean;
  /** Display order within the template (1-based) */
  displayOrder: number;
  /** Template-specific overrides (merged on read by caller if needed) */
  configOverrides: ConfigOverrides | null;
}

/**
 * Base question record type
 */
export interface Question {
  id: string;
  slug: string;
  type: string;
  questionText: string;
  description: string | null;
  options: QuestionOption[] | null;
  validation: QuestionValidation | null;
  videoId: string | null;
  scoreDimension: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Map database record to Question type
 */
function mapToQuestion(record: typeof questions.$inferSelect): Question {
  return {
    id: record.id,
    slug: record.slug,
    type: record.type,
    questionText: record.questionText,
    description: record.description,
    options: record.options,
    validation: record.validation,
    videoId: record.videoId,
    scoreDimension: record.scoreDimension,
    isActive: record.isActive,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

/**
 * Find a question by ID
 *
 * Questions are system content (no RLS required).
 */
export async function findByQuestionId(db: DbClient, id: string): Promise<Question | null> {
  const records = await db.select().from(questions).where(eq(questions.id, id)).limit(1);

  if (records.length === 0) {
    return null;
  }

  return mapToQuestion(records[0]);
}

/**
 * Find multiple questions by IDs
 *
 * Fetches all questions matching the provided IDs in a single query.
 * Returns questions in no guaranteed order. Missing IDs are silently ignored.
 *
 * @param ids - Array of question UUIDs to fetch
 * @returns Array of found questions (may be fewer than requested if some IDs don't exist)
 */
export async function findByQuestionIds(db: DbClient, ids: string[]): Promise<Question[]> {
  if (ids.length === 0) {
    return [];
  }

  const records = await db.select().from(questions).where(inArray(questions.id, ids));

  return records.map(mapToQuestion);
}

/**
 * Find a question by slug
 *
 * Useful for looking up questions by human-readable identifier.
 *
 * @param slug - The question slug (e.g., 'goal-primary', 'pain-level')
 */
export async function findQuestionBySlug(db: DbClient, slug: string): Promise<Question | null> {
  const records = await db.select().from(questions).where(eq(questions.slug, slug)).limit(1);

  if (records.length === 0) {
    return null;
  }

  return mapToQuestion(records[0]);
}

/**
 * Find all questions for a template, ordered by display order
 *
 * Joins with template_questions to get questions associated with a template,
 * including display order and any config overrides.
 *
 * @param templateId - The assessment template UUID
 * @returns Questions with template-specific config, ordered by displayOrder
 */
export async function findByTemplateId(
  db: DbClient,
  templateId: string
): Promise<QuestionWithConfig[]> {
  const records = await db
    .select({
      id: questions.id,
      slug: questions.slug,
      type: questions.type,
      questionText: questions.questionText,
      description: questions.description,
      options: questions.options,
      validation: questions.validation,
      videoId: questions.videoId,
      scoreDimension: questions.scoreDimension,
      isActive: questions.isActive,
      displayOrder: templateQuestions.displayOrder,
      configOverrides: templateQuestions.configOverrides,
    })
    .from(templateQuestions)
    .innerJoin(questions, eq(templateQuestions.questionId, questions.id))
    .where(eq(templateQuestions.templateId, templateId))
    .orderBy(asc(templateQuestions.displayOrder));

  return records.map((record) => ({
    id: record.id,
    slug: record.slug,
    type: record.type,
    questionText: record.questionText,
    description: record.description,
    options: record.options,
    validation: record.validation,
    videoId: record.videoId,
    scoreDimension: record.scoreDimension,
    isActive: record.isActive,
    displayOrder: record.displayOrder,
    configOverrides: record.configOverrides,
  }));
}

/**
 * Find all questions for multiple templates, ordered by display order within each template
 *
 * Useful for fetching all questions across multiple templates in a single query.
 * Returns results grouped by template, maintaining display order.
 *
 * @param templateIds - Array of assessment template UUIDs
 * @returns Questions with template-specific config, ordered by templateId then displayOrder
 */
export async function findByTemplateIds(
  db: DbClient,
  templateIds: string[]
): Promise<QuestionWithConfig[]> {
  if (templateIds.length === 0) {
    return [];
  }

  const records = await db
    .select({
      id: questions.id,
      slug: questions.slug,
      type: questions.type,
      questionText: questions.questionText,
      description: questions.description,
      options: questions.options,
      validation: questions.validation,
      videoId: questions.videoId,
      scoreDimension: questions.scoreDimension,
      isActive: questions.isActive,
      displayOrder: templateQuestions.displayOrder,
      configOverrides: templateQuestions.configOverrides,
      templateId: templateQuestions.templateId,
    })
    .from(templateQuestions)
    .innerJoin(questions, eq(templateQuestions.questionId, questions.id))
    .where(inArray(templateQuestions.templateId, templateIds))
    .orderBy(asc(templateQuestions.templateId), asc(templateQuestions.displayOrder));

  return records.map((record) => ({
    id: record.id,
    slug: record.slug,
    type: record.type,
    questionText: record.questionText,
    description: record.description,
    options: record.options,
    validation: record.validation,
    videoId: record.videoId,
    scoreDimension: record.scoreDimension,
    isActive: record.isActive,
    displayOrder: record.displayOrder,
    configOverrides: record.configOverrides,
  }));
}

/**
 * Find all active questions
 *
 * @param options.activeOnly - If true (default), only return active questions
 */
export async function findAllQuestions(
  db: DbClient,
  options?: { activeOnly?: boolean }
): Promise<Question[]> {
  const query = db.select().from(questions);

  const records =
    options?.activeOnly !== false ? await query.where(eq(questions.isActive, true)) : await query;

  return records.map(mapToQuestion);
}
