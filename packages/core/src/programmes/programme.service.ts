import { eq, and } from 'drizzle-orm';

import { userAssessments } from '@ffp/database/schema';

import * as userAssessmentRepo from '../assessments/user-assessment.repository';
import { getUserIdFromContext, type OrganisationContext } from '../lib/context';
import { withRLS } from '../lib/database';
import { ForbiddenError, NotFoundError, ValidationError } from '../lib/errors';

import {
  archiveProgramme,
  createProgramme,
  createProgrammePhases,
  findProgrammeByUserId,
  findTemplateBySlug,
  findTemplatePhases,
  setReplacementProgramme,
} from './programme.repository';

import type { Programme, NewProgrammePhase } from './programme.repository';
import type { Transaction } from '../lib/database';

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
  tx?: Transaction;
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
  options: GenerateProgrammeOptions = {}
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
  const phases = await findTemplatePhases(template.id, { tx });

  if (phases.length > 0) {
    const phaseInputs: NewProgrammePhase[] = phases.map((phase) => ({
      organisationId,
      programmeId: programme.id,
      templatePhaseId: phase.id,
      phaseNumber: phase.phaseNumber,
      name: phase.name,
    }));

    await createProgrammePhases(organisationId, phaseInputs, { tx });
  }

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

  if (!assessment) {
    throw new NotFoundError('Assessment', input.assessmentId);
  }

  // Belt-and-braces ownership check (RLS already scopes, but defence-in-depth)
  if (assessment.userId !== userId) {
    throw new ForbiddenError('You do not have permission to access this assessment.');
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
