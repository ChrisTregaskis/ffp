import { getDb } from '@ffp/database';

import { type OrganisationContext } from '../lib/context';
import { ConflictError, NotFoundError, ValidationError } from '../lib/errors';
import {
  createQuestionSchema,
  questionShapeSchema,
  updateQuestionSchema,
  type QuestionType,
  type UpdateQuestionInput,
} from '../schemas/assessment-question.schema';

import * as questionRepository from './question.repository';

import type { Question } from './question.repository';

export type { Question };

/** Types whose `validation` carries a numeric range — value, length or duration bounds. */
const RANGED_QUESTION_TYPES: readonly QuestionType[] = [
  'numeric',
  'scale',
  'text',
  'video-response',
];

/** List question bank entries. `_ctx` is unused — questions are system catalogue content. */
export async function listQuestionsService(
  _ctx: OrganisationContext,
  options?: { activeOnly?: boolean }
): Promise<Question[]> {
  const db = getDb();

  return await questionRepository.findAllQuestions(db, options);
}

/** Get a question by public identifier. */
export async function getQuestionService(
  _ctx: OrganisationContext,
  publicId: string
): Promise<Question | null> {
  const db = getDb();

  return await questionRepository.findQuestionByPublicId(db, publicId);
}

/** Create a question. Enforces slug uniqueness (409 on collision). */
export async function createQuestionService(
  _ctx: OrganisationContext,
  input: unknown
): Promise<Question> {
  const parseResult = createQuestionSchema.safeParse(input);

  if (!parseResult.success) {
    throw new ValidationError('Invalid question input', { errors: parseResult.error.issues });
  }

  const db = getDb();

  const existing = await questionRepository.findQuestionBySlug(db, parseResult.data.slug);

  if (existing) {
    throw new ConflictError('A question with this slug already exists', {
      slug: parseResult.data.slug,
    });
  }

  return await questionRepository.createQuestion(db, parseResult.data);
}

/**
 * Drop what the outgoing type owned. Clearing beats rejecting — changing type is
 * deliberate — and a field the payload sets explicitly still wins.
 */
function applyTypeChangeCleanup(
  stored: Question,
  update: UpdateQuestionInput
): UpdateQuestionInput {
  const nextType = update.type;

  if (!nextType || nextType === stored.type) {
    return update;
  }

  const cleaned: UpdateQuestionInput = { ...update };

  if (nextType !== 'video-response' && cleaned.videoId === undefined) {
    cleaned.videoId = null;
  }

  // Only stored configuration is cleaned up. A payload sending `validation`
  // replaces it outright and is judged on its merits, so a value the author
  // typed is rejected rather than quietly deleted.
  if (cleaned.validation === undefined && stored.validation) {
    const takesRange = RANGED_QUESTION_TYPES.includes(nextType);

    cleaned.validation = {
      ...stored.validation,
      maxSelections: nextType === 'multi-choice' ? stored.validation.maxSelections : undefined,
      min: takesRange ? stored.validation.min : undefined,
      max: takesRange ? stored.validation.max : undefined,
    };
  }

  return cleaned;
}

/**
 * Check what the row will become. The `maxSelections` cap in particular needs
 * the stored options, which the payload need not have resent.
 */
function assertMergedShape(stored: Question, update: UpdateQuestionInput): void {
  const parseResult = questionShapeSchema.safeParse({
    type: update.type ?? stored.type,
    options: update.options ?? stored.options,
    validation: update.validation ?? stored.validation,
    // `??` would be wrong on a clearable field: an explicit `null` means clear,
    // and must not fall through to the stored value.
    videoId: update.videoId !== undefined ? update.videoId : stored.videoId,
  });

  if (!parseResult.success) {
    throw new ValidationError('This update would leave the question in an invalid state', {
      errors: parseResult.error.issues,
    });
  }
}

/**
 * Update a question by public identifier. `slug` is immutable; the nullable
 * fields clear on an explicit `null` and survive omission.
 */
export async function updateQuestionService(
  _ctx: OrganisationContext,
  publicId: string,
  input: unknown
): Promise<Question> {
  const parseResult = updateQuestionSchema.safeParse(input);

  if (!parseResult.success) {
    throw new ValidationError('Invalid question update input', {
      errors: parseResult.error.issues,
    });
  }

  const db = getDb();

  const question = await questionRepository.findQuestionByPublicId(db, publicId);

  if (!question) {
    throw new NotFoundError('Question', publicId);
  }

  // Clean up first, or the stale config trips the very check that exists to
  // prevent it.
  const update = applyTypeChangeCleanup(question, parseResult.data);

  assertMergedShape(question, update);

  return await questionRepository.updateQuestion(db, question.id, update);
}

/** Deactivate a question (soft delete), resolved by public identifier. */
export async function deactivateQuestionService(
  _ctx: OrganisationContext,
  publicId: string
): Promise<void> {
  const db = getDb();

  const question = await questionRepository.findQuestionByPublicId(db, publicId);

  if (!question) {
    throw new NotFoundError('Question', publicId);
  }

  await questionRepository.deactivateQuestion(db, question.id);
}
