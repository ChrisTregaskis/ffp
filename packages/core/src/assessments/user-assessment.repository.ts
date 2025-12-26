import { eq, and } from 'drizzle-orm';

import type { UserAssessmentStatus } from '@ffp/database';
import { userAssessments } from '@ffp/database/schema';

import { withRLS } from '../lib/database';
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
 * Update assessment progress
 *
 * Updates currentStep and/or merges new answers.
 * Does not change status - use transitionStatus for that.
 *
 * @param userId - Optional user ID for fine-grained RLS. While tenant-level
 *   isolation is sufficient for current needs, passing userId enables future
 *   user-level RLS policies without API changes.
 */
export async function updateProgress(
  tenantId: string,
  assessmentId: string,
  data: UpdateUserAssessmentInput,
  userId?: string
): Promise<UserAssessment> {
  return await withRLS(tenantId, userId, async (tx) => {
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

    // Merge answers if provided
    const mergedAnswers = data.answers
      ? { ...(currentRecord.answers as object), ...data.answers }
      : currentRecord.answers;

    const [record] = await tx
      .update(userAssessments)
      .set({
        currentStep: data.currentStep ?? currentRecord.currentStep,
        answers: mergedAnswers,
        updatedAt: new Date(),
      })
      .where(eq(userAssessments.id, assessmentId))
      .returning();

    return mapToUserAssessment(record);
  });
}

/**
 * Transition assessment to a new status
 *
 * Validates that the transition is allowed by the state machine.
 * Updates relevant timestamp fields based on the target status.
 *
 * @param toStatus - Target status
 * @param userId - Optional user ID for fine-grained RLS. While tenant-level
 *   isolation is sufficient for current needs, passing userId enables future
 *   user-level RLS policies without API changes.
 * @throws NotFoundError if assessment not found
 * @throws ValidationError if transition is not allowed
 */
export async function transitionStatus(
  tenantId: string,
  assessmentId: string,
  toStatus: UserAssessmentStatus,
  userId?: string
): Promise<UserAssessment> {
  return await withRLS(tenantId, userId, async (tx) => {
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
