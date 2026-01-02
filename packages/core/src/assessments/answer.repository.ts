import { eq, and, inArray } from 'drizzle-orm';

import type { AnswerValue } from '@ffp/database';
import { userAssessmentAnswers } from '@ffp/database/schema';

import { withRLS, type Transaction } from '../lib/database';

export interface UserAssessmentAnswer {
  id: string;
  tenantId: string;
  userAssessmentId: string;
  questionId: string;
  answerValue: AnswerValue;
  answeredAt: Date;
}

export interface SaveAnswerInput {
  questionId: string;
  answerValue: AnswerValue;
}

/**
 * Map database record to UserAssessmentAnswer type
 */
function mapToAnswer(record: typeof userAssessmentAnswers.$inferSelect): UserAssessmentAnswer {
  return {
    id: record.id,
    tenantId: record.tenantId,
    userAssessmentId: record.userAssessmentId,
    questionId: record.questionId,
    answerValue: record.answerValue,
    answeredAt: record.answeredAt,
  };
}

// RLS is enforced via tenant context.
export async function findByAssessmentId(
  tenantId: string,
  assessmentId: string,
  userId?: string
): Promise<UserAssessmentAnswer[]> {
  return await withRLS(tenantId, userId, async (tx) => {
    const records = await tx
      .select()
      .from(userAssessmentAnswers)
      .where(eq(userAssessmentAnswers.userAssessmentId, assessmentId));

    return records.map(mapToAnswer);
  });
}

// RLS is enforced via tenant context.
export async function findByAssessmentAndQuestion(
  tenantId: string,
  assessmentId: string,
  questionId: string,
  userId?: string
): Promise<UserAssessmentAnswer | null> {
  return await withRLS(tenantId, userId, async (tx) => {
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

    if (records.length === 0) {
      return null;
    }

    return mapToAnswer(records[0]);
  });
}

export interface UpsertAnswerOptions {
  /** Optional user ID for fine-grained RLS */
  userId?: string;
  /** Optional transaction for atomic operations across multiple writes */
  tx?: Transaction;
}

/**
 * Upsert an answer for an assessment question (internal implementation)
 *
 * Uses PostgreSQL ON CONFLICT to insert or update the answer.
 */
async function upsertAnswerInTx(
  tx: Transaction,
  tenantId: string,
  assessmentId: string,
  questionId: string,
  answerValue: AnswerValue
): Promise<UserAssessmentAnswer> {
  const now = new Date();

  const [record] = await tx
    .insert(userAssessmentAnswers)
    .values({
      tenantId,
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

  return mapToAnswer(record);
}

/**
 * Upsert an answer for an assessment question
 *
 * Inserts a new answer or updates existing answer for the question.
 * Uses PostgreSQL ON CONFLICT for atomic upsert operation.
 */
export async function upsertAnswer(
  tenantId: string,
  assessmentId: string,
  questionId: string,
  answerValue: AnswerValue,
  options: UpsertAnswerOptions = {}
): Promise<UserAssessmentAnswer> {
  const { userId, tx } = options;

  // If transaction provided, use it directly (caller must set RLS)
  if (tx) {
    return upsertAnswerInTx(tx, tenantId, assessmentId, questionId, answerValue);
  }

  // Otherwise, create new transaction with RLS
  return await withRLS(tenantId, userId, async (newTx) => {
    return upsertAnswerInTx(newTx, tenantId, assessmentId, questionId, answerValue);
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
  tenantId: string,
  assessmentId: string,
  answers: SaveAnswerInput[]
): Promise<UserAssessmentAnswer[]> {
  if (answers.length === 0) {
    return [];
  }

  const now = new Date();

  const values = answers.map((answer) => ({
    tenantId,
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

    results.push(mapToAnswer(record));
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
  tenantId: string,
  assessmentId: string,
  answers: SaveAnswerInput[],
  options: SaveAnswersOptions = {}
): Promise<UserAssessmentAnswer[]> {
  const { userId, tx } = options;

  // If transaction provided, use it directly (caller must set RLS)
  if (tx) {
    return saveAnswersInTx(tx, tenantId, assessmentId, answers);
  }

  // Otherwise, create new transaction with RLS
  return await withRLS(tenantId, userId, async (newTx) => {
    return saveAnswersInTx(newTx, tenantId, assessmentId, answers);
  });
}

/**
 * Delete all answers for an assessment
 *
 * Used when resetting an assessment. Typically followed by status transition.
 */
export async function deleteByAssessmentId(
  tenantId: string,
  assessmentId: string,
  userId?: string
): Promise<void> {
  await withRLS(tenantId, userId, async (tx) => {
    await tx
      .delete(userAssessmentAnswers)
      .where(eq(userAssessmentAnswers.userAssessmentId, assessmentId));
  });
}

/**
 * Delete specific answers by question IDs
 */
export async function deleteByQuestionIds(
  tenantId: string,
  assessmentId: string,
  questionIds: string[],
  userId?: string
): Promise<void> {
  if (questionIds.length === 0) {
    return;
  }

  await withRLS(tenantId, userId, async (tx) => {
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
