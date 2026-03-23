import { eq, and, inArray } from 'drizzle-orm';

import type { AnswerValue } from '@ffp/database';
import { userAssessmentAnswers, templateQuestions } from '@ffp/database/schema';

import { withRLS, type Transaction } from '../lib/database';

// User assessment answer record type - inferred from Drizzle schema
export type UserAssessmentAnswer = typeof userAssessmentAnswers.$inferSelect;

export interface SaveAnswerInput {
  questionId: string;
  answerValue: AnswerValue;
}

export interface FindByAssessmentIdOptions {
  /** Optional user ID for fine-grained RLS */
  userId?: string;
  /** Optional transaction for reading within an existing transaction */
  tx?: Transaction;
}

export interface UpsertAnswerOptions {
  /** Optional user ID for fine-grained RLS */
  userId?: string;
  /** Optional transaction for atomic operations across multiple writes */
  tx?: Transaction;
}

/**
 * Find all answers for an assessment
 */
export async function findByAssessmentId(
  organisationId: string,
  assessmentId: string,
  options: FindByAssessmentIdOptions = {}
): Promise<UserAssessmentAnswer[]> {
  const { userId, tx } = options;

  const doQuery = async (dbTx: Transaction): Promise<UserAssessmentAnswer[]> => {
    return await dbTx
      .select()
      .from(userAssessmentAnswers)
      .where(eq(userAssessmentAnswers.userAssessmentId, assessmentId));
  };

  // If transaction provided, use it directly
  if (tx) {
    return doQuery(tx);
  }

  // Otherwise, create new transaction with RLS
  return await withRLS(organisationId, userId, doQuery);
}

// RLS is enforced via organisation context.
export async function findByAssessmentAndQuestion(
  organisationId: string,
  assessmentId: string,
  questionId: string,
  userId?: string
): Promise<UserAssessmentAnswer | null> {
  return await withRLS(organisationId, userId, async (tx) => {
    const records = await tx
      .select()
      .from(userAssessmentAnswers)
      .where(
        and(
          eq(userAssessmentAnswers.userAssessmentId, assessmentId),
          eq(userAssessmentAnswers.questionId, questionId)
        )
      )
      .limit(1);

    return records[0] ?? null;
  });
}

/**
 * Upsert an answer for an assessment question (internal implementation)
 *
 * Uses PostgreSQL ON CONFLICT to insert or update the answer.
 */
async function upsertAnswerInTx(
  tx: Transaction,
  organisationId: string,
  assessmentId: string,
  questionId: string,
  answerValue: AnswerValue
): Promise<UserAssessmentAnswer> {
  const now = new Date();

  const [record] = await tx
    .insert(userAssessmentAnswers)
    .values({
      organisationId,
      userAssessmentId: assessmentId,
      questionId,
      answerValue,
      answeredAt: now,
    })
    .onConflictDoUpdate({
      target: [userAssessmentAnswers.userAssessmentId, userAssessmentAnswers.questionId],
      set: {
        answerValue,
        answeredAt: now,
      },
    })
    .returning();

  return record;
}

/**
 * Upsert an answer for an assessment question
 *
 * Inserts a new answer or updates existing answer for the question.
 * Uses PostgreSQL ON CONFLICT for atomic upsert operation.
 */
export async function upsertAnswer(
  organisationId: string,
  assessmentId: string,
  questionId: string,
  answerValue: AnswerValue,
  options: UpsertAnswerOptions = {}
): Promise<UserAssessmentAnswer> {
  const { userId, tx } = options;

  // If transaction provided, use it directly (caller must set RLS)
  if (tx) {
    return upsertAnswerInTx(tx, organisationId, assessmentId, questionId, answerValue);
  }

  // Otherwise, create new transaction with RLS
  return await withRLS(organisationId, userId, async (newTx) => {
    return upsertAnswerInTx(newTx, organisationId, assessmentId, questionId, answerValue);
  });
}

export interface SaveAnswersOptions {
  /** Optional user ID for fine-grained RLS */
  userId?: string;
  /** Optional transaction for atomic operations across multiple writes */
  tx?: Transaction;
}

/**
 * Save multiple answers for an assessment (internal implementation)
 *
 * Upserts all answers atomically within the transaction.
 */
async function saveAnswersInTx(
  tx: Transaction,
  organisationId: string,
  assessmentId: string,
  answers: SaveAnswerInput[]
): Promise<UserAssessmentAnswer[]> {
  if (answers.length === 0) {
    return [];
  }

  const now = new Date();

  const values = answers.map((answer) => ({
    organisationId,
    userAssessmentId: assessmentId,
    questionId: answer.questionId,
    answerValue: answer.answerValue,
    answeredAt: now,
  }));

  // Use ON CONFLICT DO UPDATE for each row
  // Note: Drizzle doesn't support batch upsert with different values per row,
  // so we process individually within the transaction
  const results: UserAssessmentAnswer[] = [];

  for (const value of values) {
    const [record] = await tx
      .insert(userAssessmentAnswers)
      .values(value)
      .onConflictDoUpdate({
        target: [userAssessmentAnswers.userAssessmentId, userAssessmentAnswers.questionId],
        set: {
          answerValue: value.answerValue,
          answeredAt: value.answeredAt,
        },
      })
      .returning();

    results.push(record);
  }

  return results;
}

/**
 * Save multiple answers for an assessment
 *
 * Atomically upserts all provided answers. Each answer is inserted if new
 * or updated if it already exists for the assessment/question combination.
 */
export async function saveAnswers(
  organisationId: string,
  assessmentId: string,
  answers: SaveAnswerInput[],
  options: SaveAnswersOptions = {}
): Promise<UserAssessmentAnswer[]> {
  const { userId, tx } = options;

  // If transaction provided, use it directly (caller must set RLS)
  if (tx) {
    return saveAnswersInTx(tx, organisationId, assessmentId, answers);
  }

  // Otherwise, create new transaction with RLS
  return await withRLS(organisationId, userId, async (newTx) => {
    return saveAnswersInTx(newTx, organisationId, assessmentId, answers);
  });
}

/**
 * Delete all answers for an assessment
 *
 * Used when resetting an assessment. Typically followed by status transition.
 */
export async function deleteByAssessmentId(
  organisationId: string,
  assessmentId: string,
  userId?: string
): Promise<void> {
  await withRLS(organisationId, userId, async (tx) => {
    await tx
      .delete(userAssessmentAnswers)
      .where(eq(userAssessmentAnswers.userAssessmentId, assessmentId));
  });
}

/**
 * Delete specific answers by question IDs
 */
export async function deleteByQuestionIds(
  organisationId: string,
  assessmentId: string,
  questionIds: string[],
  userId?: string
): Promise<void> {
  if (questionIds.length === 0) {
    return;
  }

  await withRLS(organisationId, userId, async (tx) => {
    await tx
      .delete(userAssessmentAnswers)
      .where(
        and(
          eq(userAssessmentAnswers.userAssessmentId, assessmentId),
          inArray(userAssessmentAnswers.questionId, questionIds)
        )
      );
  });
}

/**
 * Find distinct template IDs from the user's saved answers
 *
 * Derives which templates the user visited by joining their answers
 * with the template_questions table. Used for submit validation to
 * only check required questions from steps the user actually visited.
 */
export async function findVisitedTemplateIds(
  organisationId: string,
  assessmentId: string,
  userId?: string
): Promise<string[]> {
  return await withRLS(organisationId, userId, async (tx) => {
    const results = await tx
      .selectDistinct({ templateId: templateQuestions.templateId })
      .from(userAssessmentAnswers)
      .innerJoin(
        templateQuestions,
        eq(userAssessmentAnswers.questionId, templateQuestions.questionId)
      )
      .where(eq(userAssessmentAnswers.userAssessmentId, assessmentId));

    return results.map((r) => r.templateId);
  });
}
