import { and, eq } from 'drizzle-orm';

import { assessmentSafetyTriggers } from '@ffp/database/schema';

import { withRLS, type Transaction } from '../lib/database';

export type AssessmentSafetyTrigger = typeof assessmentSafetyTriggers.$inferSelect;

export interface RecordSafetyTriggerInput {
  organisationId: string;
  userAssessmentId: string;
  userId: string;
  questionSlug: string | null;
  selectedOptions: string[];
  warningMessage: string;
}

export interface SafetyTriggerOptions {
  /** Optional user ID for fine-grained RLS */
  userId?: string;
  /** Optional transaction for atomic operations across multiple writes */
  tx?: Transaction;
}

/**
 * Record that an assessment's answers fired a safety warning. An assessment is
 * counted once: a second record for the same assessment is ignored.
 */
export async function recordTrigger(
  input: RecordSafetyTriggerInput,
  options: SafetyTriggerOptions = {}
): Promise<void> {
  const doInsert = async (dbTx: Transaction): Promise<void> => {
    await dbTx
      .insert(assessmentSafetyTriggers)
      .values(input)
      .onConflictDoNothing({ target: assessmentSafetyTriggers.userAssessmentId });
  };

  // If transaction provided, use it directly (caller must set RLS)
  if (options.tx) {
    return doInsert(options.tx);
  }

  await withRLS(input.organisationId, options.userId ?? input.userId, doInsert);
}

export async function findByAssessmentId(
  organisationId: string,
  assessmentId: string,
  options: SafetyTriggerOptions = {}
): Promise<AssessmentSafetyTrigger | null> {
  const doQuery = async (dbTx: Transaction): Promise<AssessmentSafetyTrigger | null> => {
    const records = await dbTx
      .select()
      .from(assessmentSafetyTriggers)
      .where(
        and(
          eq(assessmentSafetyTriggers.userAssessmentId, assessmentId),
          eq(assessmentSafetyTriggers.organisationId, organisationId)
        )
      )
      .limit(1);

    return records[0] ?? null;
  };

  if (options.tx) {
    return doQuery(options.tx);
  }

  return await withRLS(organisationId, options.userId, doQuery);
}
