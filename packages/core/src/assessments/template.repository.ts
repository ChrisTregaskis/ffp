import { and, asc, eq, inArray, max, notInArray } from 'drizzle-orm';

import type { DbClient, DbQueryClient } from '@ffp/database';
import {
  assessmentTemplates,
  questions,
  templateQuestions,
  type AssessmentTemplateRecord,
  type TemplateQuestionRecord,
} from '@ffp/database/schema';

import { NotFoundError } from '../lib/errors';
import { findByTemplateId as findQuestionsByTemplateId } from '../questions/question.repository';

import type { Question, QuestionWithConfig } from '../questions/question.repository';
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

/** Find a template by public identifier — the lookup the question-assignment routes key on. */
export async function findTemplateByPublicId(
  db: DbClient,
  publicId: string
): Promise<AssessmentTemplate | null> {
  const records = await db
    .select()
    .from(assessmentTemplates)
    .where(eq(assessmentTemplates.publicId, publicId))
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

/** Returns the raw template_questions join records (not the full questions), in display order. */
export async function findQuestionAssignmentsByTemplateId(
  db: DbQueryClient,
  templateId: string
): Promise<Pick<TemplateQuestionRecord, 'questionId' | 'displayOrder' | 'configOverrides'>[]> {
  return await db
    .select({
      questionId: templateQuestions.questionId,
      displayOrder: templateQuestions.displayOrder,
      configOverrides: templateQuestions.configOverrides,
    })
    .from(templateQuestions)
    .where(eq(templateQuestions.templateId, templateId))
    .orderBy(asc(templateQuestions.displayOrder));
}

/**
 * Bumps a template's `updatedAt` so a change to its question set is visible to
 * anything watching the template itself — the join rows live in another table.
 */
export async function touchTemplate(db: DbQueryClient, templateId: string): Promise<void> {
  await db
    .update(assessmentTemplates)
    .set({ updatedAt: new Date() })
    .where(eq(assessmentTemplates.id, templateId));
}

/** Highest display order currently assigned to a template, or 0 when it has no questions. */
export async function findMaxDisplayOrder(db: DbQueryClient, templateId: string): Promise<number> {
  const [result] = await db
    .select({ maxDisplayOrder: max(templateQuestions.displayOrder) })
    .from(templateQuestions)
    .where(eq(templateQuestions.templateId, templateId));

  return result.maxDisplayOrder ?? 0;
}

/** Appends question assignments to a template, numbering them from firstDisplayOrder. */
export async function assignQuestions(
  db: DbQueryClient,
  templateId: string,
  questionIds: string[],
  firstDisplayOrder: number
): Promise<TemplateQuestionRecord[]> {
  return await db
    .insert(templateQuestions)
    .values(
      questionIds.map((questionId, index) => ({
        templateId,
        questionId,
        displayOrder: firstDisplayOrder + index,
        configOverrides: null,
      }))
    )
    .returning();
}

/**
 * Removes a question assignment. The question itself is untouched — only the
 * join row goes. Returns false when the question was not assigned.
 */
export async function unassignQuestion(
  db: DbQueryClient,
  templateId: string,
  questionId: string
): Promise<boolean> {
  const deleted = await db
    .delete(templateQuestions)
    .where(
      and(
        eq(templateQuestions.templateId, templateId),
        eq(templateQuestions.questionId, questionId)
      )
    )
    .returning({ id: templateQuestions.id });

  return deleted.length > 0;
}

/** Sets one assignment's display order, keyed by the unique (template, question) pair. */
async function setDisplayOrder(
  db: DbQueryClient,
  templateId: string,
  questionId: string,
  displayOrder: number
): Promise<void> {
  await db
    .update(templateQuestions)
    .set({ displayOrder })
    .where(
      and(
        eq(templateQuestions.templateId, templateId),
        eq(templateQuestions.questionId, questionId)
      )
    );
}

/**
 * Closes gaps in a template's display order after an unassign, so the sequence
 * stays contiguous and 1-based. Walking in ascending order only ever lowers a
 * value into an already-vacated slot, so UNIQUE(template_id, display_order) holds.
 */
export async function renumberTemplateQuestions(
  db: DbQueryClient,
  templateId: string
): Promise<void> {
  const assignments = await findQuestionAssignmentsByTemplateId(db, templateId);

  for (let index = 0; index < assignments.length; index++) {
    const expectedOrder = index + 1;

    if (assignments[index].displayOrder !== expectedOrder) {
      await setDisplayOrder(db, templateId, assignments[index].questionId, expectedOrder);
    }
  }
}

/**
 * Reorders a template's assignments to match the position of each question in
 * orderedQuestionIds (1-based).
 *
 * UNIQUE(template_id, display_order) rejects a direct swap, so every assignment
 * is first parked on a temporary negative order and only then written to its
 * final positive one.
 */
export async function reorderTemplateQuestions(
  db: DbQueryClient,
  templateId: string,
  orderedQuestionIds: string[]
): Promise<void> {
  for (let index = 0; index < orderedQuestionIds.length; index++) {
    await setDisplayOrder(db, templateId, orderedQuestionIds[index], -(index + 1));
  }

  for (let index = 0; index < orderedQuestionIds.length; index++) {
    await setDisplayOrder(db, templateId, orderedQuestionIds[index], index + 1);
  }
}

/** Active questions not yet assigned to the template — the pool an admin can add from. */
export async function findAssignableQuestions(
  db: DbClient,
  templateId: string
): Promise<Question[]> {
  const assignedQuestionIds = db
    .select({ questionId: templateQuestions.questionId })
    .from(templateQuestions)
    .where(eq(templateQuestions.templateId, templateId));

  return await db
    .select()
    .from(questions)
    .where(and(eq(questions.isActive, true), notInArray(questions.id, assignedQuestionIds)))
    .orderBy(asc(questions.slug));
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
