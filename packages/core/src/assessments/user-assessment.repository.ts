import { eq, and, or, desc, sql } from 'drizzle-orm';

import type { UserAssessmentStatus } from '@ffp/database';
import { userAssessments, type UserAssessmentRecord } from '@ffp/database/schema';
import type { UserAssessmentScores } from '@ffp/database/types';

import { withRLS, type Transaction } from '../lib/database';
import { NotFoundError, ValidationError } from '../lib/errors';
import {
  isValidStatusTransition,
  getAllowedTransitions,
  type CreateUserAssessmentInput,
  type UpdateUserAssessmentInput,
} from '../schemas/user-assessment.schema';
import { warningsArraySchema, type Warning } from '../schemas/warning.schema';

export type UserAssessment = UserAssessmentRecord;

export interface UpdateAssessmentProgressOptions {
  /** Optional user ID for fine-grained RLS */
  userId?: string;
  /** Optional transaction for atomic operations across multiple writes */
  tx?: Transaction;
}

export interface TransitionAssessmentStatusOptions {
  /** Optional user ID for fine-grained RLS */
  userId?: string;
  /** Optional transaction for atomic operations across multiple writes */
  tx?: Transaction;
}

export interface AppendWarningsOptions {
  /** Optional transaction for atomic operations */
  tx?: Transaction;
}

/** Creates an assessment instance in 'not_started' status. */
export async function createUserAssessment(
  input: CreateUserAssessmentInput
): Promise<UserAssessment> {
  return await withRLS(input.tenantId, input.userId, async (tx) => {
    const [record] = await tx
      .insert(userAssessments)
      .values({
        tenantId: input.tenantId,
        userId: input.userId,
        flowId: input.flowId,
        currentStep: 1,
        status: 'not_started',
      })
      .returning();

    return record;
  });
}

export async function findUserAssessmentById(
  tenantId: string,
  assessmentId: string,
  userId?: string
): Promise<UserAssessment | null> {
  return await withRLS(tenantId, userId, async (tx) => {
    const records = await tx
      .select()
      .from(userAssessments)
      .where(eq(userAssessments.id, assessmentId))
      .limit(1);

    if (records.length === 0) {
      return null;
    }

    return records[0];
  });
}

export async function findByUserId(
  tenantId: string,
  userId: string,
  options?: { status?: UserAssessmentStatus }
): Promise<UserAssessment[]> {
  return await withRLS(tenantId, userId, async (tx) => {
    const conditions = [eq(userAssessments.userId, userId)];

    if (options?.status) {
      conditions.push(eq(userAssessments.status, options.status));
    }

    const records = await tx
      .select()
      .from(userAssessments)
      .where(and(...conditions));

    return records;
  });
}

export async function findAssessmentInProgress(
  tenantId: string,
  userId: string,
  flowId?: string
): Promise<UserAssessment | null> {
  return await withRLS(tenantId, userId, async (tx) => {
    const conditions = [
      eq(userAssessments.userId, userId),
      eq(userAssessments.status, 'in_progress'),
    ];

    if (flowId) {
      conditions.push(eq(userAssessments.flowId, flowId));
    }

    const records = await tx
      .select()
      .from(userAssessments)
      .where(and(...conditions))
      .limit(1);

    if (records.length === 0) {
      return null;
    }

    return records[0];
  });
}

/** Returns an existing assessment that can be resumed (not_started or in_progress). */
export async function findResumableAssessment(
  tenantId: string,
  userId: string,
  flowId: string
): Promise<UserAssessment | null> {
  return await withRLS(tenantId, userId, async (tx) => {
    const records = await tx
      .select()
      .from(userAssessments)
      .where(
        and(
          eq(userAssessments.userId, userId),
          eq(userAssessments.flowId, flowId),
          or(eq(userAssessments.status, 'not_started'), eq(userAssessments.status, 'in_progress'))
        )
      )
      .orderBy(desc(userAssessments.createdAt))
      .limit(1);

    if (records.length === 0) {
      return null;
    }

    return records[0];
  });
}

/** Returns the most recent assessment that has been submitted (submitted, scored, or completed). */
export async function findSubmittedAssessment(
  tenantId: string,
  userId: string,
  flowId: string
): Promise<UserAssessment | null> {
  return await withRLS(tenantId, userId, async (tx) => {
    const records = await tx
      .select()
      .from(userAssessments)
      .where(
        and(
          eq(userAssessments.userId, userId),
          eq(userAssessments.flowId, flowId),
          or(
            eq(userAssessments.status, 'submitted'),
            eq(userAssessments.status, 'scored'),
            eq(userAssessments.status, 'completed')
          )
        )
      )
      .orderBy(desc(userAssessments.createdAt))
      .limit(1);

    if (records.length === 0) {
      return null;
    }

    return records[0];
  });
}

/**
 * Abandon any in-progress or not-started assessments for a given flow/user.
 * Used when starting a reassessment to ensure only one active assessment exists.
 */
export async function abandonInProgressAssessments(
  tenantId: string,
  userId: string,
  flowId: string
): Promise<number> {
  return await withRLS(tenantId, userId, async (tx) => {
    const result = await tx
      .update(userAssessments)
      .set({ status: 'abandoned' as const, updatedAt: new Date() })
      .where(
        and(
          eq(userAssessments.userId, userId),
          eq(userAssessments.flowId, flowId),
          or(eq(userAssessments.status, 'not_started'), eq(userAssessments.status, 'in_progress'))
        )
      )
      .returning({ id: userAssessments.id });

    return result.length;
  });
}

/** Executes the update logic within a provided transaction. */
async function updateAssessmentProgressInTx(
  tx: Transaction,
  assessmentId: string,
  data: UpdateUserAssessmentInput
): Promise<UserAssessment> {
  // Fetch current assessment
  const existing = await tx
    .select()
    .from(userAssessments)
    .where(eq(userAssessments.id, assessmentId))
    .limit(1);

  if (existing.length === 0) {
    throw new NotFoundError('User assessment', assessmentId);
  }

  const currentRecord = existing[0];

  // Only update currentStep
  const [record] = await tx
    .update(userAssessments)
    .set({
      currentStep: data.currentStep ?? currentRecord.currentStep,
      updatedAt: new Date(),
    })
    .where(eq(userAssessments.id, assessmentId))
    .returning();

  return record;
}

/**
 * Updates currentStep only. Does not change status - use transitionStatus for that.
 * Note: Answers are stored in the user_assessment_answers table.
 * Use answerRepository.saveAnswers() to save answers separately.
 */
export async function updateAssessmentProgress(
  tenantId: string,
  assessmentId: string,
  data: UpdateUserAssessmentInput,
  options: UpdateAssessmentProgressOptions = {}
): Promise<UserAssessment> {
  const { userId, tx } = options;

  // If transaction provided, use it directly (caller must set RLS)
  if (tx) {
    return updateAssessmentProgressInTx(tx, assessmentId, data);
  }

  // Otherwise, create new transaction with RLS
  return await withRLS(tenantId, userId, async (newTx) => {
    return updateAssessmentProgressInTx(newTx, assessmentId, data);
  });
}

/** Executes the transition logic within a provided transaction. */
async function transitionAssessmentStatusInTx(
  tx: Transaction,
  assessmentId: string,
  toStatus: UserAssessmentStatus
): Promise<UserAssessment> {
  // Fetch current assessment
  const existing = await tx
    .select()
    .from(userAssessments)
    .where(eq(userAssessments.id, assessmentId))
    .limit(1);

  if (existing.length === 0) {
    throw new NotFoundError('User assessment', assessmentId);
  }

  const currentRecord = existing[0];
  const fromStatus = currentRecord.status;

  // Validate transition
  if (!isValidStatusTransition(fromStatus, toStatus)) {
    const allowed = getAllowedTransitions(fromStatus);
    throw new ValidationError(
      `Invalid status transition: ${fromStatus} → ${toStatus}. ` +
        `Allowed transitions from '${fromStatus}': ${allowed.length > 0 ? allowed.join(', ') : 'none'}`
    );
  }

  // Prepare update with status-specific timestamps
  const now = new Date();
  const updateData: Partial<typeof userAssessments.$inferInsert> = {
    status: toStatus,
    updatedAt: now,
  };

  // Set timestamps based on target status
  if (toStatus === 'in_progress' && !currentRecord.startedAt) {
    updateData.startedAt = now;
  }
  if (toStatus === 'submitted') {
    updateData.submittedAt = now;
  }
  if (toStatus === 'completed') {
    updateData.completedAt = now;
  }

  const [record] = await tx
    .update(userAssessments)
    .set(updateData)
    .where(eq(userAssessments.id, assessmentId))
    .returning();

  return record;
}

/**
 * Validates that the transition is allowed by the state machine.
 * Updates relevant timestamp fields based on the target status.
 */
export async function transitionAssessmentStatus(
  tenantId: string,
  assessmentId: string,
  toStatus: UserAssessmentStatus,
  options: TransitionAssessmentStatusOptions = {}
): Promise<UserAssessment> {
  const { userId, tx } = options;

  // If transaction provided, use it directly (caller must set RLS)
  if (tx) {
    return transitionAssessmentStatusInTx(tx, assessmentId, toStatus);
  }

  // Otherwise, create new transaction with RLS
  return await withRLS(tenantId, userId, async (newTx) => {
    return transitionAssessmentStatusInTx(newTx, assessmentId, toStatus);
  });
}

/**
 * Called after scoring job completes.
 * Typically followed by transitionStatus to 'scored'.
 */
export async function updateAssessmentScores(
  tenantId: string,
  assessmentId: string,
  scores: UserAssessmentScores,
  userId?: string
): Promise<UserAssessment> {
  return await withRLS(tenantId, userId, async (tx) => {
    const existing = await tx
      .select()
      .from(userAssessments)
      .where(eq(userAssessments.id, assessmentId))
      .limit(1);

    if (existing.length === 0) {
      throw new NotFoundError('User assessment', assessmentId);
    }

    const [record] = await tx
      .update(userAssessments)
      .set({
        scores,
        updatedAt: new Date(),
      })
      .where(eq(userAssessments.id, assessmentId))
      .returning();

    return record;
  });
}

/**
 * Called after programme generation job completes.
 * Typically followed by transitionStatus to 'completed'.
 */
export async function linkAssessmentToProgramme(
  tenantId: string,
  assessmentId: string,
  programmeId: string,
  userId?: string
): Promise<UserAssessment> {
  return await withRLS(tenantId, userId, async (tx) => {
    const existing = await tx
      .select()
      .from(userAssessments)
      .where(eq(userAssessments.id, assessmentId))
      .limit(1);

    if (existing.length === 0) {
      throw new NotFoundError('User assessment', assessmentId);
    }

    const [record] = await tx
      .update(userAssessments)
      .set({
        programmeId,
        updatedAt: new Date(),
      })
      .where(eq(userAssessments.id, assessmentId))
      .returning();

    return record;
  });
}

/** Append warnings to an assessment's warnings_shown array */
export async function appendAssessmentWarnings(
  tenantId: string,
  assessmentId: string,
  warnings: Warning[],
  options: AppendWarningsOptions = {}
): Promise<void> {
  const { tx } = options;

  // If no warnings to add, skip the update
  if (warnings.length === 0) {
    return;
  }

  // Validate warnings structure before SQL interpolation.
  // This ensures malformed data cannot cause unexpected behaviour.
  const validatedWarnings = warningsArraySchema.parse(warnings);
  const warningsJson = JSON.stringify(validatedWarnings);

  const doAppend = async (dbTx: Transaction): Promise<void> => {
    // Use JSONB concatenation to append warnings to existing array
    // COALESCE handles null case, defaulting to empty array
    // Note: warningsJson is parameterised by Drizzle's sql template tag
    await dbTx
      .update(userAssessments)
      .set({
        warningsShown: sql`COALESCE(${userAssessments.warningsShown}, '[]'::jsonb) || ${warningsJson}::jsonb`,
        updatedAt: new Date(),
      })
      .where(and(eq(userAssessments.id, assessmentId), eq(userAssessments.tenantId, tenantId)));
  };

  // If transaction provided, use it directly
  if (tx) {
    await doAppend(tx);
    return;
  }

  // Otherwise, create new transaction with RLS
  await withRLS(tenantId, undefined, async (newTx) => {
    await doAppend(newTx);
  });
}
