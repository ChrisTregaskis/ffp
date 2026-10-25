import { eq, and, or, desc, gt, inArray, sql } from 'drizzle-orm';

import {
  setAdminContext,
  setRLSContext,
  type DbClient,
  type UserAssessmentStatus,
} from '@ffp/database';
import { organisations, userAssessments, type UserAssessmentRecord } from '@ffp/database/schema';

import { withRLS, type Transaction } from '../lib/database';
import { NotFoundError, ValidationError } from '../lib/errors';
import {
  isValidStatusTransition,
  getAllowedTransitions,
  type CreateUserAssessmentInput,
  type UpdateUserAssessmentInput,
} from '../schemas/user-assessment/user-assessment.schema';
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
  return await withRLS(input.organisationId, input.userId, async (tx) => {
    const [record] = await tx
      .insert(userAssessments)
      .values({
        organisationId: input.organisationId,
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
  organisationId: string,
  assessmentId: string,
  userId?: string
): Promise<UserAssessment | null> {
  return await withRLS(organisationId, userId, async (tx) => {
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

/** Returns an existing assessment that can be resumed (not_started or in_progress). */
export async function findResumableAssessment(
  organisationId: string,
  userId: string,
  flowId: string
): Promise<UserAssessment | null> {
  return await withRLS(organisationId, userId, async (tx) => {
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
  organisationId: string,
  userId: string,
  flowId: string
): Promise<UserAssessment | null> {
  return await withRLS(organisationId, userId, async (tx) => {
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
  organisationId: string,
  userId: string,
  flowId: string
): Promise<number> {
  return await withRLS(organisationId, userId, async (tx) => {
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
  organisationId: string,
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
  return await withRLS(organisationId, userId, async (newTx) => {
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
  organisationId: string,
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
  return await withRLS(organisationId, userId, async (newTx) => {
    return transitionAssessmentStatusInTx(newTx, assessmentId, toStatus);
  });
}

/** Append warnings to an assessment's warnings_shown array */
export async function appendAssessmentWarnings(
  organisationId: string,
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
      .where(
        and(
          eq(userAssessments.id, assessmentId),
          eq(userAssessments.organisationId, organisationId)
        )
      );
  };

  // If transaction provided, use it directly
  if (tx) {
    await doAppend(tx);

    return;
  }

  // Otherwise, create new transaction with RLS
  await withRLS(organisationId, undefined, async (newTx) => {
    await doAppend(newTx);
  });
}

/**
 * Record the member's consent to the safety advice their answers raised. The first
 * acknowledgement stands: a repeat keeps the original timestamp.
 */
export async function acknowledgeSafetyAdvice(
  organisationId: string,
  assessmentId: string,
  userId?: string
): Promise<UserAssessment> {
  return await withRLS(organisationId, userId, async (tx) => {
    const records = await tx
      .update(userAssessments)
      .set({
        safetyAcknowledgedAt: sql`COALESCE(${userAssessments.safetyAcknowledgedAt}, now())`,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(userAssessments.id, assessmentId),
          eq(userAssessments.organisationId, organisationId)
        )
      )
      .returning();

    if (records.length === 0) {
      throw new NotFoundError('User assessment', assessmentId);
    }

    return records[0];
  });
}

/** A transaction opened on the shared client (`getDb().transaction`). */
type DbTransaction = Parameters<Parameters<DbClient['transaction']>[0]>[0];

/**
 * Move every open assessment on a flow stored after `order` back one step, in every
 * organisation, once the steps after a removed step have moved down one order, so each member
 * stays on the step they were on. Runs in the caller's transaction.
 *
 * `user_assessments` has no admin bypass, so organisations are listed through the one
 * `organisations` has, then each organisation's rows are updated under its own RLS context.
 * The organisation filter repeats the policy, so the write stays inside one organisation even
 * where RLS isn't forced. One statement per organisation: fine at today's scale, but an
 * admin-only route through a single statement would need a policy or function by migration.
 * The caller must hold no organisation context, as it is cleared afterwards.
 */
export async function shiftOpenAssessmentsBack(
  tx: DbTransaction,
  flowId: string,
  order: number
): Promise<void> {
  await setAdminContext(tx);
  const organisationRows = await tx.select({ id: organisations.id }).from(organisations);
  await tx.execute(sql`SELECT set_config('app.is_admin', 'false', true)`);

  for (const { id: organisationId } of organisationRows) {
    await setRLSContext(tx, organisationId);
    await tx
      .update(userAssessments)
      .set({ currentStep: sql`${userAssessments.currentStep} - 1`, updatedAt: new Date() })
      .where(
        and(
          eq(userAssessments.organisationId, organisationId),
          eq(userAssessments.flowId, flowId),
          inArray(userAssessments.status, ['not_started', 'in_progress']),
          gt(userAssessments.currentStep, order)
        )
      );
  }

  await tx.execute(sql`SELECT set_config('app.organisation_id', '', true)`);
}
