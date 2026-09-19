import { getDb, type DbClient } from '@ffp/database';

import { getUserIdFromContext, type OrganisationContext } from '../lib/context';
import { ConflictError, InternalServerError, NotFoundError, ValidationError } from '../lib/errors';
import * as questionRepository from '../questions/question.repository';
import {
  assignQuestionsSchema,
  createAssessmentTemplateSchema,
  reorderTemplateQuestionsSchema,
  updateAssessmentTemplateSchema,
  type AssessmentTemplate,
  type CreateAssessmentTemplateInput,
  type UpdateAssessmentTemplateInput,
} from '../schemas/assessment-template.schema';

import * as templateRepository from './template.repository';

import type { AssessmentTemplateWithQuestions } from './template.repository';
import type { Question, QuestionWithConfig } from '../questions/question.repository';

export type { AssessmentTemplate, AssessmentTemplateWithQuestions };
export type CreateTemplateInput = Omit<CreateAssessmentTemplateInput, 'createdBy'>;

/** Create a new assessment template */
export async function createTemplateService(
  ctx: OrganisationContext,
  input: CreateTemplateInput
): Promise<AssessmentTemplate> {
  const userId = await getUserIdFromContext(ctx);

  // Build full input with createdBy from actor
  const fullInput: CreateAssessmentTemplateInput = {
    ...input,
    createdBy: userId,
  };

  // Validate against Zod schema
  const parseResult = createAssessmentTemplateSchema.safeParse(fullInput);

  if (!parseResult.success) {
    throw new ValidationError('Invalid template input', {
      errors: parseResult.error.issues,
    });
  }

  const db = getDb();

  return await templateRepository.createTemplate(db, parseResult.data);
}

/** Update an existing assessment template */
export async function updateTemplateService(
  _ctx: OrganisationContext,
  templateId: string,
  input: UpdateAssessmentTemplateInput
): Promise<AssessmentTemplate> {
  // Validate against Zod schema
  const parseResult = updateAssessmentTemplateSchema.safeParse(input);

  if (!parseResult.success) {
    throw new ValidationError('Invalid template update input', {
      errors: parseResult.error.issues,
    });
  }

  const db = getDb();

  return await templateRepository.updateTemplate(db, templateId, parseResult.data);
}

/** Deactivate an assessment template (soft delete) */
export async function deactivateTemplateService(
  _ctx: OrganisationContext,
  templateId: string
): Promise<void> {
  const db = getDb();

  await templateRepository.deactivateTemplate(db, templateId);
}

/** Duplicate an assessment template */
export async function duplicateTemplateService(
  ctx: OrganisationContext,
  templateId: string,
  newName: string
): Promise<AssessmentTemplateWithQuestions> {
  const userId = await getUserIdFromContext(ctx);
  const db = getDb();

  // Validate source template exists
  const sourceTemplate = await templateRepository.findTemplateById(db, templateId);

  if (!sourceTemplate) {
    throw new NotFoundError('Assessment template', templateId);
  }

  // Fetch source template's question assignments
  const sourceTemplateQuestions = await templateRepository.findQuestionAssignmentsByTemplateId(
    db,
    templateId
  );

  // Duplicate template and its questions in a transaction
  const duplicatedTemplateId = await templateRepository.createDuplicateTemplate(
    db,
    userId,
    newName,
    sourceTemplate,
    sourceTemplateQuestions
  );

  // Fetch and return the complete duplicated template with questions
  // (read operation, outside transaction - uses repository for full hydration)
  const result = await templateRepository.findTemplateWithQuestions(db, duplicatedTemplateId);

  // Should never be null since we just created it
  if (!result) {
    throw new InternalServerError('Failed to fetch duplicated template after creation');
  }

  return result;
}

/**
 * Get an assessment template by ID with questions
 * @param _ctx - Organisation context (unused for system content, but maintains consistent API)
 */
export async function getTemplateService(
  _ctx: OrganisationContext,
  templateId: string
): Promise<AssessmentTemplateWithQuestions | null> {
  const db = getDb();

  return await templateRepository.findTemplateWithQuestions(db, templateId);
}

/**
 * List assessment templates
 * @param _ctx - Organisation context (unused for system content, but maintains consistent API)
 */
export async function listTemplatesService(
  _ctx: OrganisationContext,
  options?: { activeOnly?: boolean }
): Promise<AssessmentTemplate[]> {
  const db = getDb();

  return await templateRepository.findAllTemplates(db, options);
}

/**
 * Resolve a template by public identifier or throw 404. Not filtered on
 * `isActive`: composing questions on a deactivated template is allowed, so it
 * can be fixed up before being reactivated.
 */
async function resolveTemplate(
  db: DbClient,
  templatePublicId: string
): Promise<AssessmentTemplate> {
  const template = await templateRepository.findTemplateByPublicId(db, templatePublicId);

  if (!template) {
    throw new NotFoundError('Assessment template', templatePublicId);
  }

  return template;
}

/**
 * Resolve the supplied public identifiers to active questions, preserving the
 * order they were supplied in. Only active questions can be composed onto a
 * template.
 */
async function resolveActiveQuestions(
  db: DbClient,
  questionPublicIds: string[]
): Promise<Question[]> {
  const found = await questionRepository.findQuestionsByPublicIds(db, questionPublicIds);
  const questionByPublicId = new Map(found.map((question) => [question.publicId, question]));

  return questionPublicIds.map((publicId) => {
    const question = questionByPublicId.get(publicId);

    if (!question) {
      throw new NotFoundError('Question', publicId);
    }

    if (!question.isActive) {
      throw new ValidationError('Only active questions can be assigned to a template', {
        questionPublicId: publicId,
      });
    }

    return question;
  });
}

/** Guards against a payload that would assign or reorder the same question twice. */
function assertDistinct(publicIds: string[]): void {
  if (new Set(publicIds).size !== publicIds.length) {
    throw new ValidationError('Question IDs must be unique');
  }
}

/**
 * Assign questions to a template, appended after the existing ones in the order
 * supplied. A question appears at most once per template, so re-assigning one
 * already on the template is a conflict rather than a no-op.
 */
export async function assignQuestionsService(
  _ctx: OrganisationContext,
  templatePublicId: string,
  input: unknown
): Promise<QuestionWithConfig[]> {
  const parseResult = assignQuestionsSchema.safeParse(input);

  if (!parseResult.success) {
    throw new ValidationError('Invalid question assignment input', {
      errors: parseResult.error.issues,
    });
  }

  const { questionPublicIds } = parseResult.data;

  assertDistinct(questionPublicIds);

  const db = getDb();
  const template = await resolveTemplate(db, templatePublicId);
  const questionsToAssign = await resolveActiveQuestions(db, questionPublicIds);

  const existingAssignments = await templateRepository.findQuestionAssignmentsByTemplateId(
    db,
    template.id
  );
  const assignedQuestionIds = new Set(existingAssignments.map((a) => a.questionId));

  const alreadyAssigned = questionsToAssign.filter((question) =>
    assignedQuestionIds.has(question.id)
  );

  if (alreadyAssigned.length > 0) {
    throw new ConflictError('One or more questions are already assigned to this template', {
      questionPublicIds: alreadyAssigned.map((question) => question.publicId),
    });
  }

  await db.transaction(async (tx) => {
    const maxDisplayOrder = await templateRepository.findMaxDisplayOrder(tx, template.id);

    await templateRepository.assignQuestions(
      tx,
      template.id,
      questionsToAssign.map((question) => question.id),
      maxDisplayOrder + 1
    );
    await templateRepository.touchTemplate(tx, template.id);
  });

  return await questionRepository.findByTemplateId(db, template.id);
}

/**
 * Remove a question from a template. The question itself survives — only the
 * assignment goes — and the remaining display orders are closed up.
 */
export async function unassignQuestionService(
  _ctx: OrganisationContext,
  templatePublicId: string,
  questionPublicId: string
): Promise<void> {
  const db = getDb();
  const template = await resolveTemplate(db, templatePublicId);

  const question = await questionRepository.findQuestionByPublicId(db, questionPublicId);

  if (!question) {
    throw new NotFoundError('Question', questionPublicId);
  }

  await db.transaction(async (tx) => {
    const unassigned = await templateRepository.unassignQuestion(tx, template.id, question.id);

    if (!unassigned) {
      throw new NotFoundError('Template question assignment', questionPublicId);
    }

    await templateRepository.renumberTemplateQuestions(tx, template.id);
    await templateRepository.touchTemplate(tx, template.id);
  });
}

/**
 * Reorder a template's assigned questions. The payload must list every question
 * currently assigned to the template exactly once — a partial order would leave
 * the sequence with gaps or duplicates.
 */
export async function reorderQuestionsService(
  _ctx: OrganisationContext,
  templatePublicId: string,
  input: unknown
): Promise<QuestionWithConfig[]> {
  const parseResult = reorderTemplateQuestionsSchema.safeParse(input);

  if (!parseResult.success) {
    throw new ValidationError('Invalid reorder input', { errors: parseResult.error.issues });
  }

  const { orderedQuestionPublicIds } = parseResult.data;

  assertDistinct(orderedQuestionPublicIds);

  const db = getDb();
  const template = await resolveTemplate(db, templatePublicId);

  const assigned = await questionRepository.findByTemplateId(db, template.id);

  if (orderedQuestionPublicIds.length !== assigned.length) {
    throw new ValidationError(
      `Expected ${String(assigned.length)} question IDs but received ${String(orderedQuestionPublicIds.length)}`
    );
  }

  const questionIdByPublicId = new Map(
    assigned.map((question) => [question.publicId, question.id])
  );

  const orderedQuestionIds = orderedQuestionPublicIds.map((publicId) => {
    const questionId = questionIdByPublicId.get(publicId);

    if (!questionId) {
      throw new ValidationError('One or more questions are not assigned to this template', {
        questionPublicId: publicId,
      });
    }

    return questionId;
  });

  await db.transaction(async (tx) => {
    await templateRepository.reorderTemplateQuestions(tx, template.id, orderedQuestionIds);
    await templateRepository.touchTemplate(tx, template.id);
  });

  return await questionRepository.findByTemplateId(db, template.id);
}

/** List the active questions that are not yet assigned to a template. */
export async function listAssignableQuestionsService(
  _ctx: OrganisationContext,
  templatePublicId: string
): Promise<Question[]> {
  const db = getDb();
  const template = await resolveTemplate(db, templatePublicId);

  return await templateRepository.findAssignableQuestions(db, template.id);
}
