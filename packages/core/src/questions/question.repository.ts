import { eq, inArray, asc, and } from 'drizzle-orm';

import type { DbClient, QuestionWithConfig } from '@ffp/database';
import { questions, templateQuestions, type QuestionRecord } from '@ffp/database/schema';

import { NotFoundError } from '../lib/errors';

import type {
  CreateQuestionInput,
  UpdateQuestionInput,
} from '../schemas/assessment-question.schema';

export type Question = QuestionRecord;

/** Questions are system content (no RLS required) */
export async function findByQuestionId(db: DbClient, id: string): Promise<Question | null> {
  const records = await db.select().from(questions).where(eq(questions.id, id)).limit(1);

  return records[0] ?? null;
}

/** Returns questions in no guaranteed order. Missing IDs are silently ignored. */
export async function findByQuestionIds(db: DbClient, ids: string[]): Promise<Question[]> {
  if (ids.length === 0) {
    return [];
  }

  return await db.select().from(questions).where(inArray(questions.id, ids));
}

export async function findQuestionBySlug(db: DbClient, slug: string): Promise<Question | null> {
  const records = await db.select().from(questions).where(eq(questions.slug, slug)).limit(1);

  return records[0] ?? null;
}

/**
 * Find all questions for a template, ordered by display order
 * @returns Questions with template-specific config, ordered by displayOrder
 */
export async function findByTemplateId(
  db: DbClient,
  templateId: string
): Promise<QuestionWithConfig[]> {
  const records = await db
    .select({
      id: questions.id,
      publicId: questions.publicId,
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
    publicId: record.publicId,
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
      publicId: questions.publicId,
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
    .where(and(inArray(templateQuestions.templateId, templateIds), eq(questions.isActive, true)))
    .orderBy(asc(templateQuestions.templateId), asc(templateQuestions.displayOrder));

  return records.map((record) => ({
    id: record.id,
    publicId: record.publicId,
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
 * Find all active questions unless explicitly requested otherwise */
export async function findAllQuestions(
  db: DbClient,
  options?: { activeOnly?: boolean }
): Promise<Question[]> {
  const query = db.select().from(questions);

  return options?.activeOnly !== false
    ? await query.where(eq(questions.isActive, true))
    : await query;
}

/** Find a question by public identifier — the lookup the admin surface routes on. */
export async function findQuestionByPublicId(
  db: DbClient,
  publicId: string
): Promise<Question | null> {
  const records = await db
    .select()
    .from(questions)
    .where(eq(questions.publicId, publicId))
    .limit(1);

  return records[0] ?? null;
}

/** Create a question bank entry. */
export async function createQuestion(db: DbClient, data: CreateQuestionInput): Promise<Question> {
  const [record] = await db
    .insert(questions)
    .values({
      slug: data.slug,
      type: data.type,
      questionText: data.questionText,
      description: data.description,
      options: data.options,
      validation: data.validation,
      videoId: data.videoId,
      scoreDimension: data.scoreDimension,
      isActive: data.isActive,
    })
    .returning();

  return record;
}

/** Update a question. `slug` is immutable (absent from the input); undefined fields are untouched. */
export async function updateQuestion(
  db: DbClient,
  questionId: string,
  data: UpdateQuestionInput
): Promise<Question> {
  const existing = await findByQuestionId(db, questionId);

  if (!existing) {
    throw new NotFoundError('Question', questionId);
  }

  const [record] = await db
    .update(questions)
    .set({
      type: data.type,
      questionText: data.questionText,
      description: data.description,
      options: data.options,
      validation: data.validation,
      videoId: data.videoId,
      scoreDimension: data.scoreDimension,
      isActive: data.isActive,
      updatedAt: new Date(),
    })
    .where(eq(questions.id, questionId))
    .returning();

  return record;
}

/** Deactivate a question (soft delete). */
export async function deactivateQuestion(db: DbClient, questionId: string): Promise<void> {
  const existing = await findByQuestionId(db, questionId);

  if (!existing) {
    throw new NotFoundError('Question', questionId);
  }

  await db
    .update(questions)
    .set({ isActive: false, updatedAt: new Date() })
    .where(eq(questions.id, questionId));
}

export async function findSlugsByIds(
  db: DbClient,
  questionIds: string[]
): Promise<Map<string, string>> {
  if (questionIds.length === 0) {
    return new Map();
  }

  const records = await db
    .select({ id: questions.id, slug: questions.slug })
    .from(questions)
    .where(inArray(questions.id, questionIds));

  return new Map(records.map((r) => [r.id, r.slug]));
}

export type { QuestionWithConfig };
