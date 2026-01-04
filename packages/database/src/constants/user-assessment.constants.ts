/**
 * User assessment constants - Single source of truth for assessment-related enums
 *
 * These constants are shared between:
 * - @ffp/database: PostgreSQL enum definitions (pgEnum)
 * - @ffp/core: Zod validation schemas (z.enum)
 *
 * IMPORTANT: When adding new assessment statuses:
 * 1. Update this file
 * 2. Run `pnpm db:generate` to create migration for enum changes
 * 3. Run `pnpm db:migrate` to apply changes
 * 4. Both database and Zod schemas will automatically use updated values
 */

/**
 * User assessment status values
 *
 * State machine lifecycle:
 * ```
 * not_started → in_progress → submitted → scored → completed
 *                    ↓
 *               abandoned
 * ```
 */
export const USER_ASSESSMENT_STATUSES = [
  // Assessment instance created but user hasn't begun
  'not_started',
  // User actively answering questions
  'in_progress',
  // User submitted, waiting for scoring job
  'submitted',
  // Scoring complete, waiting for programme generation
  'scored',
  // Full flow done with programme generated
  'completed',
  // User didn't finish (timeout or explicit abandon)
  'abandoned',
] as const;

export type UserAssessmentStatus = (typeof USER_ASSESSMENT_STATUSES)[number];

// Valid state transitions for the assessment state machine
export const VALID_STATUS_TRANSITIONS: Record<UserAssessmentStatus, UserAssessmentStatus[]> = {
  // not_started → in_progress (user starts assessment)
  not_started: ['in_progress'],
  // in_progress → submitted (user submits answers)
  // in_progress → abandoned (user abandons or times out)
  in_progress: ['submitted', 'abandoned'],
  // submitted → scored (scoring job completes)
  submitted: ['scored'],
  // scored → completed (programme generation completes)
  scored: ['completed'],
  completed: [],
  abandoned: [],
};
