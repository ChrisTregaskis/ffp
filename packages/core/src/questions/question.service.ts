import { getDb, type DbClient } from '@ffp/database';

import { type OrganisationContext } from '../lib/context';
import { ConflictError, NotFoundError, ValidationError } from '../lib/errors';
import {
  adminQuestionSchema,
  createQuestionSchema,
  questionShapeSchema,
  RANGED_QUESTION_TYPES,
  updateQuestionSchema,
  type AdminQuestion,
  type AdminQuestionDetail,
  type QuestionListFilters,
  type UpdateQuestionInput,
} from '../schemas/assessment-question.schema';
import {
  buildPaginationMeta,
  type PaginationInput,
  type PaginationMeta,
} from '../schemas/pagination.schema';
import * as videoRepository from '../videos/video.repository';

import * as questionRepository from './question.repository';

import type { Question } from './question.repository';

export type { Question };

/** List question bank entries — one page, filtered. `_ctx` is unused: questions are catalogue content. */
export async function listQuestionsService(
  _ctx: OrganisationContext,
  paginationInput: PaginationInput,
  filters: QuestionListFilters
): Promise<{ data: AdminQuestion[]; pagination: PaginationMeta }> {
  const db = getDb();

  const records = await questionRepository.findQuestionPage(db, paginationInput, filters);
  const total = await questionRepository.countQuestions(db, filters);

  return {
    data: records.map((record) => adminQuestionSchema.parse(record)),
    pagination: buildPaginationMeta(paginationInput, total),
  };
}

/** The admin read of one question: the row, where it is used, and its linked video. */
async function toQuestionDetail(db: DbClient, question: Question): Promise<AdminQuestionDetail> {
  const [usage, video] = await Promise.all([
    questionRepository.findQuestionUsage(db, question.id),
    question.videoId ? videoRepository.findVideoById(db, question.videoId) : null,
  ]);

  return {
    ...adminQuestionSchema.parse(question),
    usage,
    linkedVideo: video ? { publicId: video.publicId, title: video.title } : null,
  };
}

/** Get a question by public identifier, with its usage and linked video. */
export async function getQuestionService(
  _ctx: OrganisationContext,
  publicId: string
): Promise<AdminQuestionDetail | null> {
  const db = getDb();

  const question = await questionRepository.findQuestionByPublicId(db, publicId);

  return question ? await toQuestionDetail(db, question) : null;
}

/**
 * `videoId` carries no foreign key, so a video that is missing or unpublished
 * would only surface when a member reached the question.
 */
async function assertVideoActive(db: DbClient, videoId: string | null | undefined): Promise<void> {
  if (!videoId) {
    return;
  }

  const video = await videoRepository.findVideoById(db, videoId);

  if (video?.status !== 'active') {
    throw new ValidationError('Linked video not found or not active', { videoId });
  }
}

/** Create a question. Enforces slug uniqueness (409 on collision). */
export async function createQuestionService(
  _ctx: OrganisationContext,
  input: unknown
): Promise<AdminQuestionDetail> {
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

  await assertVideoActive(db, parseResult.data.videoId);

  const question = await questionRepository.createQuestion(db, parseResult.data);

  return await toQuestionDetail(db, question);
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
    // `??` would be wrong on a clearable field: an explicit `null` means clear,
    // and must not fall through to the stored value.
    validation: update.validation !== undefined ? update.validation : stored.validation,
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
): Promise<AdminQuestionDetail> {
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

  // Only a newly linked video is checked, so a stored link that has since gone
  // stale does not block every other edit to the question.
  if (update.videoId !== question.videoId) {
    await assertVideoActive(db, update.videoId);
  }

  const updated = await questionRepository.updateQuestion(db, question.id, update);

  return await toQuestionDetail(db, updated);
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
