import { NotFoundError, ValidationError } from '../lib/errors';

import { createProgramme, findProgrammeByUserId, findTemplateBySlug } from './programme.repository';

import type { Transaction } from '../lib/database';

export interface GenerateProgrammeInput {
  tenantId: string;
  /** User who completed the assessment */
  userId: string;
  /** Programme template slug from scoring result (e.g., 'gentle-mobility-programme') */
  recommendedTemplateSlug: string | null;
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

/** Generate a programme for a user based on assessment scoring results. */
export async function generateProgramme(
  input: GenerateProgrammeInput,
  options: GenerateProgrammeOptions = {}
): Promise<GenerateProgrammeResult> {
  const { tenantId, userId, recommendedTemplateSlug } = input;
  const { tx } = options;

  // Retake path — if user already has an active programme, return it
  const existing = await findProgrammeByUserId(tenantId, userId, { tx });

  if (existing) {
    return {
      programmeId: existing.id,
      programmeName: existing.name,
      isExisting: true,
    };
  }

  // Validate that scoring produced a recommendation
  if (!recommendedTemplateSlug) {
    throw new ValidationError(
      'No programme recommendation provided. Scoring config may be missing programMappings.'
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

  // Create programme from template
  const programme = await createProgramme(
    {
      tenantId,
      userId,
      programmeTemplateId: template.id,
      name: template.name,
      description: template.description,
    },
    { tx }
  );

  return {
    programmeId: programme.id,
    programmeName: programme.name,
    isExisting: false,
  };
}
