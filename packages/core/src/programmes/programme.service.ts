import { eq, and } from 'drizzle-orm';

import { DIFFICULTIES } from '@ffp/database/constants';
import { userAssessments } from '@ffp/database/schema';

import * as userAssessmentRepo from '../assessments/user-assessment.repository';
import { getUserIdFromContext, type OrganisationContext } from '../lib/context';
import { withRLS } from '../lib/database';
import { NotFoundError, ValidationError } from '../lib/errors';
import { calculatePercent } from '../lib/math';

import { findMemberProgrammeStructure } from './member-programme.repository';
import { materialiseProgrammeSessions } from './programme-materialisation';
import {
  archiveProgramme,
  countProgress,
  createProgramme,
  createProgrammePhases,
  findProgrammeByUserId,
  findProgrammeWithPhases,
  findTemplateBySlug,
  findTemplateStructure,
  setReplacementProgramme,
} from './programme.repository';

import type { Programme, NewProgrammePhase } from './programme.repository';
import type { Transaction } from '../lib/database';
import type {
  ProgrammeDetailResponse,
  ProgressSummaryResponse,
} from '../schemas/programme/programme.schema';

export interface GenerateProgrammeInput {
  organisationId: string;
  /** User who completed the assessment */
  userId: string;
  /** Programme template slug from scoring result (e.g., 'gentle-mobility-programme') */
  recommendedTemplateSlug: string | null;
  /** If true, archive any existing active programme and create a new one */
  replaceExisting?: boolean;
}

export interface GenerateProgrammeOptions {
  /** Programme and member layer are written together; RLS set by the caller */
  tx: Transaction;
}

export interface GenerateProgrammeResult {
  /** Programme UUID (either existing or newly created) */
  programmeId: string;
  /** Programme display name */
  programmeName: string;
  /** True if an existing active programme was returned (retake path) */
  isExisting: boolean;
}

export interface ReplaceProgrammeInput {
  /** The completed reassessment whose recommendation should replace the active programme */
  assessmentId: string;
}

export interface ReplaceProgrammeResult {
  /** New programme UUID */
  programmeId: string;
  /** New programme display name */
  programmeName: string;
}

/** Generate a programme for a user based on assessment scoring results. */
export async function generateProgramme(
  input: GenerateProgrammeInput,
  options: GenerateProgrammeOptions
): Promise<GenerateProgrammeResult> {
  const { organisationId, userId, recommendedTemplateSlug, replaceExisting } = input;
  const { tx } = options;

  // Check for existing active programme
  const existing = await findProgrammeByUserId(organisationId, userId, { tx });

  if (existing && replaceExisting) {
    // Reassessment path — archive the old programme and create a new one below
    await archiveProgramme(organisationId, existing.id, userId, { tx, reason: 'reassessment' });
  } else if (existing) {
    // Retake path — return the existing active programme
    return {
      programmeId: existing.id,
      programmeName: existing.name,
      isExisting: true,
    };
  }

  // Validate that scoring produced a recommendation
  if (!recommendedTemplateSlug) {
    throw new ValidationError(
      'No programme recommendation provided. Scoring config may be missing programmeMappings.'
    );
  }

  // Look up template by slug (no RLS — system-managed table)
  const template = await findTemplateBySlug(recommendedTemplateSlug, { tx });

  if (!template) {
    throw new NotFoundError('Programme template', recommendedTemplateSlug);
  }

  if (!template.isActive) {
    throw new ValidationError(
      `Programme template '${recommendedTemplateSlug}' is inactive and cannot be used for generation.`
    );
  }

  // Create programme from template, snapshotting structure metadata
  const programme = await createProgramme(
    {
      organisationId,
      userId,
      programmeTemplateId: template.id,
      name: template.name,
      description: template.description,
      totalPhases: template.totalPhases,
    },
    { tx }
  );

  // Eagerly create programme phase rows from the template definition
  const templateStructure = await findTemplateStructure(tx, template.id);

  const phaseInputs: NewProgrammePhase[] = [...templateStructure.phases.values()].map(
    ({ phase }) => ({
      organisationId,
      programmeId: programme.id,
      templatePhaseId: phase.id,
      phaseNumber: phase.phaseNumber,
      name: phase.name,
    })
  );

  const phases = await createProgrammePhases(organisationId, phaseInputs, { tx });

  await materialiseProgrammeSessions(tx, organisationId, templateStructure, phases);

  // Link the archived programme to its replacement (if we archived one above)
  if (existing && replaceExisting) {
    await setReplacementProgramme(organisationId, existing.id, programme.id, { tx });
  }

  return {
    programmeId: programme.id,
    programmeName: programme.name,
    isExisting: false,
  };
}

/** Fetch the current user's active programme, or null if none exists. */
export async function getActiveProgramme(context: OrganisationContext): Promise<Programme | null> {
  const userId = await getUserIdFromContext(context);

  return await findProgrammeByUserId(context.organisationId, userId);
}

/**
 * Replace the user's active programme with the recommendation from a reassessment.
 *
 * - Looks up the assessment's scores to find the recommended template slug
 * - Archives the current active programme
 * - Creates a new programme from the recommended template
 * - Updates the assessment to point to the new programme
 */
export async function replaceProgramme(
  input: ReplaceProgrammeInput,
  context: OrganisationContext
): Promise<ReplaceProgrammeResult> {
  const userId = await getUserIdFromContext(context);
  const { organisationId } = context;

  // Fetch the assessment to read its scores
  const assessment = await userAssessmentRepo.findUserAssessmentById(
    organisationId,
    input.assessmentId,
    userId
  );

  // RLS scopes to the organisation only; another member's assessment answers as missing
  if (!assessment || assessment.userId !== userId) {
    throw new NotFoundError('Assessment', input.assessmentId);
  }

  // Only allow replacement from a scored or completed assessment
  if (!(['scored', 'completed'] as string[]).includes(assessment.status)) {
    throw new ValidationError(
      `Assessment must be scored before programme replacement. Current status: ${assessment.status}`
    );
  }

  if (!assessment.scores) {
    throw new ValidationError('Assessment has not been scored yet. Cannot replace programme.');
  }

  const recommendedSlug = assessment.scores.recommendedTemplateSlug;

  if (!recommendedSlug) {
    throw new ValidationError(
      'Assessment scoring did not produce a programme recommendation. Cannot replace programme.'
    );
  }

  // Use a single transaction for the atomic archive + create + link
  return await withRLS(organisationId, userId, async (tx) => {
    const result = await generateProgramme(
      {
        organisationId,
        userId,
        recommendedTemplateSlug: recommendedSlug,
        replaceExisting: true,
      },
      { tx }
    );

    // Link the assessment to the new programme (within the same transaction)
    await tx
      .update(userAssessments)
      .set({ programmeId: result.programmeId, updatedAt: new Date() })
      .where(and(eq(userAssessments.id, input.assessmentId), eq(userAssessments.userId, userId)));

    return {
      programmeId: result.programmeId,
      programmeName: result.programmeName,
    };
  });
}

type Difficulty = (typeof DIFFICULTIES)[number];

const DEFAULT_DIFFICULTY: Difficulty = 'beginner';

function isDifficulty(value: string | null | undefined): value is Difficulty {
  return typeof value === 'string' && (DIFFICULTIES as readonly string[]).includes(value);
}

/** Build template summary from repository data, with safe defaults. */
function buildTemplateSummary(template: { name: string; difficulty: string | null } | null): {
  name: string;
  difficulty: Difficulty;
} {
  return {
    name: template?.name ?? 'Unknown',
    difficulty: isDifficulty(template?.difficulty) ? template.difficulty : DEFAULT_DIFFICULTY,
  };
}

/**
 * Fetch the active programme with full hierarchy and tiered visibility.
 *
 * - Current/completed phases: full exercise detail + user session data
 * - Future phases: session summaries only (name, exercise count)
 * - Current phase: first programme_phase with status not_started or in_progress
 */
export async function getProgrammeDetail(
  context: OrganisationContext
): Promise<ProgrammeDetailResponse> {
  const userId = await getUserIdFromContext(context);
  const { organisationId } = context;

  // Fetch programme + phases (RLS-scoped)
  const result = await findProgrammeWithPhases(organisationId, userId);

  if (!result) {
    throw new NotFoundError('Active programme');
  }

  const { programme, phases, template } = result;

  // Determine current phase (first not_started or in_progress, ordered by phaseNumber)
  const currentPhase = phases.find((p) => p.status === 'not_started' || p.status === 'in_progress');
  const currentPhaseNumber = currentPhase?.phaseNumber ?? null;

  // Accessible = completed + in_progress + current (which may be not_started)
  const accessiblePhaseIds = phases
    .filter(
      (p) => p.status === 'completed' || p.status === 'in_progress' || p.id === currentPhase?.id
    )
    .map((p) => p.id);

  const memberStructure = await findMemberProgrammeStructure(organisationId, userId, phases);

  // Merge and apply tiered visibility
  const detailPhases = phases.map((phase) => {
    const isAccessible = accessiblePhaseIds.includes(phase.id);
    const memberPhase = memberStructure.get(phase.id);

    const sessions = (memberPhase?.sessions ?? []).map((detail) => {
      const sessionBase = {
        templateSessionId: detail.templateSession.id,
        templateSessionPublicId: detail.templateSession.publicId,
        sessionNumber: detail.session.sessionNumber,
        name: detail.templateSession.name,
        description: detail.templateSession.description,
        estimatedDurationMinutes: detail.templateSession.estimatedDurationMinutes,
        exerciseCount: detail.exercises.length,
      };

      if (!isAccessible) {
        // Future phase — summary only (no exercises or user session data)
        return { ...sessionBase, userSession: undefined, exercises: undefined };
      }

      const completionIndex = new Map(detail.completions.map((c) => [c.userSessionExerciseId, c]));

      return {
        ...sessionBase,
        userSession: {
          id: detail.session.id,
          status: detail.session.status,
          startedAt: detail.session.startedAt,
          completedAt: detail.session.completedAt,
          skippedAt: detail.session.skippedAt,
        },
        exercises: detail.exercises.map((ex) => {
          const completion = completionIndex.get(ex.id);

          return {
            sessionExerciseId: ex.id,
            orderIndex: ex.orderIndex,
            sets: ex.sets,
            reps: ex.reps,
            durationSeconds: ex.durationSeconds,
            restSeconds: ex.restSeconds,
            notes: ex.notes,
            video: {
              id: ex.video.id,
              title: ex.video.title,
              durationSeconds: ex.video.durationSeconds,
              difficulty: ex.video.difficulty,
            },
            completion: completion
              ? {
                  id: completion.id,
                  completed: completion.completed,
                  completedAt: completion.completedAt,
                  skipped: completion.skipped,
                }
              : null,
          };
        }),
      };
    });

    return {
      id: phase.id,
      publicId: phase.publicId,
      phaseNumber: phase.phaseNumber,
      name: phase.name ?? memberPhase?.templatePhase?.name ?? null,
      description: memberPhase?.templatePhase?.description ?? null,
      status: phase.status,
      sessions,
    };
  });

  return {
    programme: {
      id: programme.id,
      name: programme.name,
      description: programme.description,
      status: programme.status,
      startedAt: programme.startedAt,
      totalPhases: programme.totalPhases,
      template: buildTemplateSummary(template),
    },
    currentPhaseNumber,
    phases: detailPhases,
  };
}

/**
 * Fetch aggregate progress summary for the user's active programme.
 *
 * Totals and completed/skipped counts all come from the member layer.
 */
export async function getProgressSummary(
  context: OrganisationContext
): Promise<ProgressSummaryResponse> {
  const userId = await getUserIdFromContext(context);
  const { organisationId } = context;

  // Fetch programme + phases
  const result = await findProgrammeWithPhases(organisationId, userId);

  if (!result) {
    throw new NotFoundError('Active programme');
  }

  const { programme, phases } = result;

  // Determine current phase (first not_started or in_progress, ordered by phaseNumber)
  const currentPhase = phases.find((p) => p.status === 'not_started' || p.status === 'in_progress');
  const currentPhaseNumber = currentPhase?.phaseNumber ?? null;

  const phaseIds = phases.map((p) => p.id);

  // Aggregate counts within a single RLS transaction (includes current phase progress)
  const counts = await countProgress(
    organisationId,
    userId,
    programme.id,
    phaseIds,
    currentPhase?.id
  );

  const currentPhaseProgressPercent = calculatePercent(
    counts.currentPhase.completedOrSkippedSessions,
    counts.currentPhase.totalSessions
  );

  return {
    programmeId: programme.id,
    programmeName: programme.name,
    totalPhases: counts.phases.total,
    completedPhases: counts.phases.completed,
    currentPhaseNumber,
    totalSessions: counts.sessions.total,
    completedSessions: counts.sessions.completed,
    skippedSessions: counts.sessions.skipped,
    totalExercises: counts.exercises.total,
    completedExercises: counts.exercises.completed,
    overallProgressPercent: calculatePercent(
      counts.sessions.completed + counts.sessions.skipped,
      counts.sessions.total
    ),
    currentPhaseProgressPercent,
    startedAt: programme.startedAt,
  };
}
