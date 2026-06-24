import { getDb } from '@ffp/database';

import { type OrganisationContext } from '../lib/context';
import { ConflictError, NotFoundError, ValidationError } from '../lib/errors';
import { createQuestionSchema, updateQuestionSchema } from '../schemas/assessment-question.schema';

import * as questionRepository from './question.repository';

import type { Question } from './question.repository';

export type { Question };

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

/** Update a question by public identifier. `slug` is immutable (not accepted in the input). */
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

  return await questionRepository.updateQuestion(db, question.id, parseResult.data);
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
