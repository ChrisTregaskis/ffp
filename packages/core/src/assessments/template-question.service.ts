import { getDb, type DbClient } from '@ffp/database';

import { type OrganisationContext } from '../lib/context';
import { ConflictError, NotFoundError, ValidationError } from '../lib/errors';
import * as questionRepository from '../questions/question.repository';
import {
  assignQuestionsSchema,
  reorderTemplateQuestionsSchema,
  type AssessmentTemplate,
} from '../schemas/assessment-template.schema';

import { assertDistinctPublicIds, resolveOrderedChildIds } from './child-payload';
import * as templateRepository from './template.repository';

import type { Question, QuestionWithConfig } from '../questions/question.repository';

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

  assertDistinctPublicIds(questionPublicIds, 'Question');

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

  const db = getDb();
  const template = await resolveTemplate(db, templatePublicId);

  const assigned = await questionRepository.findByTemplateId(db, template.id);

  const orderedQuestionIds = resolveOrderedChildIds(
    parseResult.data.orderedQuestionPublicIds,
    assigned,
    {
      noun: 'Question',
      strangerMessage: 'One or more questions are not assigned to this template',
    }
  );

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
