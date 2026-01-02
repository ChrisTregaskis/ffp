import { eq, inArray } from 'drizzle-orm';

import type { DbClient } from '@ffp/database';
import { assessmentTemplates } from '@ffp/database/schema';

import { NotFoundError } from '../lib/errors';
import { findByTemplateId as findQuestionsByTemplateId } from '../questions/question.repository';

import type { QuestionWithConfig } from '../questions/question.repository';
import type {
  AssessmentTemplate,
  CreateAssessmentTemplateInput,
  UpdateAssessmentTemplateInput,
} from '../schemas/assessment-template.schema';

export interface AssessmentTemplateWithQuestions extends AssessmentTemplate {
  /** Questions in display order, loaded from template_questions join */
  templateQuestions: QuestionWithConfig[];
}

/**
 * Map database record to AssessmentTemplate type
 *
 * Converts the Drizzle select result to the Zod-defined AssessmentTemplate type.
 * The cast through unknown is safe because JSONB data is validated by Zod
 * schemas before being stored in the database.
 */
function mapToTemplate(record: typeof assessmentTemplates.$inferSelect): AssessmentTemplate {
  return {
    id: record.id,
    name: record.name,
    description: record.description,
    version: record.version,
    questions: record.questions as unknown as AssessmentTemplate['questions'],
    scoringConfig: record.scoringConfig as unknown as AssessmentTemplate['scoringConfig'],
    isActive: record.isActive,
    createdBy: record.createdBy,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

/**
 * Find an assessment template by ID
 */
export async function findById(db: DbClient, id: string): Promise<AssessmentTemplate | null> {
  const records = await db
    .select()
    .from(assessmentTemplates)
    .where(eq(assessmentTemplates.id, id))
    .limit(1);

  if (records.length === 0) {
    return null;
  }

  return mapToTemplate(records[0]);
}

/**
 * Find multiple assessment templates by IDs
 *
 * Fetches all templates matching the provided IDs in a single query.
 * Returns templates in no guaranteed order. Missing IDs are silently ignored.
 *
 * @param ids - Array of template UUIDs to fetch
 * @returns Array of found templates (may be fewer than requested if some IDs don't exist)
 */
export async function findTemplatesByIds(
  db: DbClient,
  ids: string[]
): Promise<AssessmentTemplate[]> {
  if (ids.length === 0) {
    return [];
  }

  const records = await db
    .select()
    .from(assessmentTemplates)
    .where(inArray(assessmentTemplates.id, ids));

  return records.map(mapToTemplate);
}

/**
 * Find all assessment templates
 *
 * @param options.activeOnly - If true, only return active templates
 */
export async function findAll(
  db: DbClient,
  options?: { activeOnly?: boolean }
): Promise<AssessmentTemplate[]> {
  const query = db.select().from(assessmentTemplates);

  const records = options?.activeOnly
    ? await query.where(eq(assessmentTemplates.isActive, true))
    : await query;

  return records.map(mapToTemplate);
}

/**
 * Create a new assessment template
 */
export async function create(
  db: DbClient,
  data: CreateAssessmentTemplateInput
): Promise<AssessmentTemplate> {
  const [record] = await db
    .insert(assessmentTemplates)
    .values({
      name: data.name,
      description: data.description,
      version: data.version,
      // Note: questions is deprecated; use template_questions join instead
      // Defaulting to empty array for backward compatibility until column is removed
      questions: data.questions ?? [],
      scoringConfig: data.scoringConfig,
      isActive: data.isActive,
      createdBy: data.createdBy,
    })
    .returning();

  return mapToTemplate(record);
}

/**
 * Update an existing assessment template
 *
 * Auto-increments the version field on each update.
 *
 * @returns Updated template
 * @throws NotFoundError if template not found
 */
export async function update(
  db: DbClient,
  id: string,
  data: UpdateAssessmentTemplateInput
): Promise<AssessmentTemplate> {
  // Fetch current template to get version for increment
  const existing = await findById(db, id);

  if (!existing) {
    throw new NotFoundError('Assessment template', id);
  }

  const [record] = await db
    .update(assessmentTemplates)
    .set({
      name: data.name,
      description: data.description,
      questions: data.questions,
      scoringConfig: data.scoringConfig,
      isActive: data.isActive,
      version: existing.version + 1,
      updatedAt: new Date(),
    })
    .where(eq(assessmentTemplates.id, id))
    .returning();

  return mapToTemplate(record);
}

/**
 * Deactivate an assessment template (soft delete)
 *
 * Sets isActive to false rather than deleting the record.
 * This preserves referential integrity with existing assessments.
 *
 * @throws NotFoundError if template not found
 */
export async function deactivate(db: DbClient, id: string): Promise<void> {
  const existing = await findById(db, id);

  if (!existing) {
    throw new NotFoundError('Assessment template', id);
  }

  await db
    .update(assessmentTemplates)
    .set({
      isActive: false,
      updatedAt: new Date(),
    })
    .where(eq(assessmentTemplates.id, id));
}

/**
 * Find an assessment template by ID with its questions loaded
 *
 * Fetches the template and its associated questions via the template_questions
 * join table. Questions are returned in display order.
 *
 */
export async function findWithQuestions(
  db: DbClient,
  id: string
): Promise<AssessmentTemplateWithQuestions | null> {
  // First fetch the template
  const template = await findById(db, id);

  if (!template) {
    return null;
  }

  // Fetch questions via question repository
  const loadedQuestions = await findQuestionsByTemplateId(db, id);

  return {
    ...template,
    templateQuestions: loadedQuestions,
  };
}
