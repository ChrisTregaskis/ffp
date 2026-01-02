import { eq, and, or } from 'drizzle-orm';

import type { UserAssessmentStatus } from '@ffp/database';
import { userAssessments } from '@ffp/database/schema';

import { withRLS, type Transaction } from '../lib/database';
import { NotFoundError, ValidationError } from '../lib/errors';
import { isValidStatusTransition, getAllowedTransitions } from '../schemas/user-assessment.schema';

import type {
  UserAssessment,
  CreateUserAssessmentInput,
  UpdateUserAssessmentInput,
  UserAssessmentAnswers,
  UserAssessmentScores,
} from '../schemas/user-assessment.schema';

/**
 * Map database record to UserAssessment type
 *
 * Converts the Drizzle select result to the Zod-defined UserAssessment type.
 * The cast through unknown is safe because JSONB data is validated by Zod
 * schemas before being stored in the database.
 */
function mapToUserAssessment(record: typeof userAssessments.$inferSelect): UserAssessment {
  return {
    id: record.id,
    tenantId: record.tenantId,
    userId: record.userId,
    flowId: record.flowId,
    currentStep: record.currentStep,
    status: record.status,
    answers: (record.answers ?? {}) as unknown as UserAssessmentAnswers,
    scores: record.scores as UserAssessmentScores | null,
    programmeId: record.programmeId,
    startedAt: record.startedAt,
    submittedAt: record.submittedAt,
    completedAt: record.completedAt,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

/**
 * Create a new user assessment
 *
 * Creates an assessment instance in 'not_started' status.
 * RLS is enforced via tenant context.
 */
export async function create(input: CreateUserAssessmentInput): Promise<UserAssessment> {
  return await withRLS(input.tenantId, input.userId, async (tx) => {
    const [record] = await tx
      .insert(userAssessments)
      .values({
        tenantId: input.tenantId,
        userId: input.userId,
        flowId: input.flowId,
        currentStep: 1,
        status: 'not_started',
        answers: {},
      })
      .returning();

    return mapToUserAssessment(record);
  });
}

/**
 * Find a user assessment by ID
 *
 * RLS is enforced via tenant context.
 *
 * @param userId - Optional user ID for fine-grained RLS. While tenant-level
 *   isolation is sufficient for current needs, passing userId enables future
 *   user-level RLS policies without API changes.
 */
export async function findById(
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

    return mapToUserAssessment(records[0]);
  });
}

/**
 * Find all assessments for a user
 *
 * RLS is enforced via tenant context.
 * @param options.status - Optional status filter
 */
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

    return records.map(mapToUserAssessment);
  });
}

/**
 * Find an in-progress assessment for a user
 *
 * Useful for checking if a user has an existing assessment to resume.
 *
 * @param flowId - Optional flow ID to filter by
 */
export async function findInProgress(
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

    return mapToUserAssessment(records[0]);
  });
}

/**
 * Find a resumable assessment for a user
 *
 * Returns an existing assessment that can be resumed (not_started or in_progress).
 * Used by the start assessment API to prevent creating duplicate assessments.
 */
export async function findResumable(
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
      .limit(1);

    if (records.length === 0) {
      return null;
    }

    return mapToUserAssessment(records[0]);
  });
}

/**
 * Update assessment progress (internal implementation)
 *
 * Executes the update logic within a provided transaction.
 */
async function updateProgressInTx(
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

  return mapToUserAssessment(record);
}

export interface UpdateProgressOptions {
  /** Optional user ID for fine-grained RLS */
  userId?: string;
  /** Optional transaction for atomic operations across multiple writes */
  tx?: Transaction;
}

/**
 * Update assessment progress
 *
 * Updates currentStep only. Does not change status - use transitionStatus for that.
 *
 * Note: Answers are stored in the user_assessment_answers table.
 * Use answerRepository.saveAnswers() to save answers separately.
 *
 * @param options.userId - Optional user ID for fine-grained RLS. While tenant-level
 *   isolation is sufficient for current needs, passing userId enables future
 *   user-level RLS policies without API changes.
 * @param options.tx - Optional transaction for atomic operations. If provided,
 *   the operation runs within this transaction (RLS must be set by caller).
 *   If not provided, creates a new transaction with RLS.
 */
export async function updateProgress(
  tenantId: string,
  assessmentId: string,
  data: UpdateUserAssessmentInput,
  options: UpdateProgressOptions = {}
): Promise<UserAssessment> {
  const { userId, tx } = options;

  // If transaction provided, use it directly (caller must set RLS)
  if (tx) {
    return updateProgressInTx(tx, assessmentId, data);
  }

  // Otherwise, create new transaction with RLS
  return await withRLS(tenantId, userId, async (newTx) => {
    return updateProgressInTx(newTx, assessmentId, data);
  });
}

/**
 * Transition assessment to a new status (internal implementation)
 *
 * Executes the transition logic within a provided transaction.
 */
async function transitionStatusInTx(
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

  return mapToUserAssessment(record);
}

export interface TransitionStatusOptions {
  /** Optional user ID for fine-grained RLS */
  userId?: string;
  /** Optional transaction for atomic operations across multiple writes */
  tx?: Transaction;
}

/**
 * Transition assessment to a new status
 *
 * Validates that the transition is allowed by the state machine.
 * Updates relevant timestamp fields based on the target status.
 *
 * @param toStatus - Target status
 * @param options.userId - Optional user ID for fine-grained RLS. While tenant-level
 *   isolation is sufficient for current needs, passing userId enables future
 *   user-level RLS policies without API changes.
 * @param options.tx - Optional transaction for atomic operations. If provided,
 *   the operation runs within this transaction (RLS must be set by caller).
 *   If not provided, creates a new transaction with RLS.
 * @throws NotFoundError if assessment not found
 * @throws ValidationError if transition is not allowed
 */
export async function transitionStatus(
  tenantId: string,
  assessmentId: string,
  toStatus: UserAssessmentStatus,
  options: TransitionStatusOptions = {}
): Promise<UserAssessment> {
  const { userId, tx } = options;

  // If transaction provided, use it directly (caller must set RLS)
  if (tx) {
    return transitionStatusInTx(tx, assessmentId, toStatus);
  }

  // Otherwise, create new transaction with RLS
  return await withRLS(tenantId, userId, async (newTx) => {
    return transitionStatusInTx(newTx, assessmentId, toStatus);
  });
}

/**
 * Update assessment scores
 *
 * Called after scoring job completes.
 * Typically followed by transitionStatus to 'scored'.
 *
 * @param scores - Calculated scores from scoring job
 * @param userId - Optional user ID for fine-grained RLS. While tenant-level
 *   isolation is sufficient for current needs, passing userId enables future
 *   user-level RLS policies without API changes.
 */
export async function updateScores(
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

    return mapToUserAssessment(record);
  });
}

/**
 * Link assessment to generated programme
 *
 * Called after programme generation job completes.
 * Typically followed by transitionStatus to 'completed'.
 *
 * @param userId - Optional user ID for fine-grained RLS. While tenant-level
 *   isolation is sufficient for current needs, passing userId enables future
 *   user-level RLS policies without API changes.
 */
export async function linkProgramme(
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

    return mapToUserAssessment(record);
  });
}
