import { eq, inArray } from 'drizzle-orm';

import type { DbClient } from '@ffp/database';
import {
  assessmentTemplates,
  templateQuestions,
  type AssessmentTemplateRecord,
  type TemplateQuestionRecord,
} from '@ffp/database/schema';

import { NotFoundError } from '../lib/errors';
import { findByTemplateId as findQuestionsByTemplateId } from '../questions/question.repository';

import type { QuestionWithConfig } from '../questions/question.repository';
import type {
  CreateAssessmentTemplateInput,
  UpdateAssessmentTemplateInput,
} from '../schemas/assessment-template.schema';

export type AssessmentTemplate = AssessmentTemplateRecord;

export interface AssessmentTemplateWithQuestions extends AssessmentTemplate {
  /** Questions in display order, loaded from template_questions join */
  templateQuestions: QuestionWithConfig[];
}

export async function findTemplateById(
  db: DbClient,
  id: string
): Promise<AssessmentTemplate | null> {
  const records = await db
    .select()
    .from(assessmentTemplates)
    .where(eq(assessmentTemplates.id, id))
    .limit(1);

  return records[0] ?? null;
}

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

  return records;
}

export async function findAllTemplates(
  db: DbClient,
  options?: { activeOnly?: boolean }
): Promise<AssessmentTemplate[]> {
  const query = db.select().from(assessmentTemplates);

  const records = options?.activeOnly
    ? await query.where(eq(assessmentTemplates.isActive, true))
    : await query;

  return records;
}

export async function createTemplate(
  db: DbClient,
  data: CreateAssessmentTemplateInput
): Promise<AssessmentTemplate> {
  const [record] = await db
    .insert(assessmentTemplates)
    .values({
      name: data.name,
      description: data.description,
      version: data.version,
      isActive: data.isActive,
      createdBy: data.createdBy,
    })
    .returning();

  return record;
}

/** Auto-increments the version field on each update. */
export async function updateTemplate(
  db: DbClient,
  id: string,
  data: UpdateAssessmentTemplateInput
): Promise<AssessmentTemplate> {
  // Fetch current template to get version for increment
  const existing = await findTemplateById(db, id);

  if (!existing) {
    throw new NotFoundError('Assessment template', id);
  }

  const [record] = await db
    .update(assessmentTemplates)
    .set({
      name: data.name,
      description: data.description,
      isActive: data.isActive,
      version: existing.version + 1,
      updatedAt: new Date(),
    })
    .where(eq(assessmentTemplates.id, id))
    .returning();

  return record;
}

/** Deactivate an assessment template (soft delete) */
export async function deactivateTemplate(db: DbClient, id: string): Promise<void> {
  const existing = await findTemplateById(db, id);

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

/** Find an assessment template by ID with its questions loaded */
export async function findTemplateWithQuestions(
  db: DbClient,
  id: string
): Promise<AssessmentTemplateWithQuestions | null> {
  // First fetch the template
  const template = await findTemplateById(db, id);

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

/** Returns the raw template_questions join records (not the full questions). */
export async function findQuestionAssignmentsByTemplateId(
  db: DbClient,
  templateId: string
): Promise<Pick<TemplateQuestionRecord, 'questionId' | 'displayOrder' | 'configOverrides'>[]> {
  return await db
    .select({
      questionId: templateQuestions.questionId,
      displayOrder: templateQuestions.displayOrder,
      configOverrides: templateQuestions.configOverrides,
    })
    .from(templateQuestions)
    .where(eq(templateQuestions.templateId, templateId));
}

export async function createDuplicateTemplate(
  db: DbClient,
  userId: string,
  newName: string,
  sourceTemplate: AssessmentTemplate,
  sourceTemplateQuestions: Pick<
    TemplateQuestionRecord,
    'questionId' | 'displayOrder' | 'configOverrides'
  >[]
): Promise<string> {
  // Wrap write operations in transaction for atomicity
  // If question copy fails, template creation is rolled back
  return await db.transaction(async (tx) => {
    // Create the duplicate template using direct Drizzle insert
    const [duplicatedTemplate] = await tx
      .insert(assessmentTemplates)
      .values({
        name: newName,
        description: sourceTemplate.description,
        version: 1,
        isActive: false, // Start as draft
        createdBy: userId,
      })
      .returning({ id: assessmentTemplates.id });

    // Copy template_questions join records
    if (sourceTemplateQuestions.length > 0) {
      const newTemplateQuestions = sourceTemplateQuestions.map((tq) => ({
        templateId: duplicatedTemplate.id,
        questionId: tq.questionId,
        displayOrder: tq.displayOrder,
        configOverrides: tq.configOverrides,
      }));

      await tx.insert(templateQuestions).values(newTemplateQuestions);
    }

    return duplicatedTemplate.id;
  });
}
