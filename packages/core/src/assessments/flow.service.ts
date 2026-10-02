import { getDb } from '@ffp/database';

import { type OrganisationContext } from '../lib/context';
import { NotFoundError, ValidationError } from '../lib/errors';
import {
  assessmentFlowListItemSchema,
  createAssessmentFlowSchema,
  updateAssessmentFlowSchema,
  type AssessmentFlowListFilters,
  type AssessmentFlowListItem,
  type CreateAssessmentFlowInput,
  type UpdateAssessmentFlowInput,
} from '../schemas/assessment-flow.schema';
import { buildPaginationMeta } from '../schemas/pagination.schema';

import { toAdminFlowStep, type AdminFlowStep } from './flow-step.branching';
import * as flowRepository from './flow.repository';

import type { AssessmentFlow } from './flow.repository';
import type { PaginationInput, PaginationMeta } from '../schemas/pagination.schema';

export type { AssessmentFlow };
export type CreateFlowInput = CreateAssessmentFlowInput;
export type UpdateFlowInput = UpdateAssessmentFlowInput;

/**
 * An assessment flow with its ordered steps loaded for the admin surface. Each
 * step carries a read-only `branchingRuleCount`; branching is not authored here.
 */
export interface AssessmentFlowWithSteps extends AssessmentFlow {
  steps: AdminFlowStep[];
}

/**
 * List assessment flows for the admin surface — one page of metadata rows, each
 * carrying its step count, alongside the pagination metadata.
 *
 * @param _ctx - (unused for system catalogue content, but
 *   maintains a consistent service API)
 */
export async function listFlowsService(
  _ctx: OrganisationContext,
  paginationInput: PaginationInput,
  filters: AssessmentFlowListFilters
): Promise<{ data: AssessmentFlowListItem[]; pagination: PaginationMeta }> {
  const db = getDb();

  const records = await flowRepository.findFlowPage(db, paginationInput, filters);
  const total = await flowRepository.countFlows(db, filters);

  return {
    data: records.map((record) => assessmentFlowListItemSchema.parse(record)),
    pagination: buildPaginationMeta(paginationInput, total),
  };
}

/**
 * Get an assessment flow by public identifier, with its steps loaded.
 *
 * @param _ctx - (unused for system catalogue content)
 */
export async function getFlowWithStepsService(
  _ctx: OrganisationContext,
  publicId: string
): Promise<AssessmentFlowWithSteps | null> {
  const db = getDb();

  const flow = await flowRepository.findByPublicId(db, publicId);

  if (!flow) {
    return null;
  }

  const steps = await flowRepository.findStepsByFlowId(db, flow.id);

  return { ...flow, steps: steps.map(toAdminFlowStep) };
}

/** Create a new assessment flow (metadata only — steps are authored separately). */
export async function createFlowService(
  _ctx: OrganisationContext,
  input: CreateFlowInput
): Promise<AssessmentFlow> {
  const parseResult = createAssessmentFlowSchema.safeParse(input);

  if (!parseResult.success) {
    throw new ValidationError('Invalid flow input', {
      errors: parseResult.error.issues,
    });
  }

  const db = getDb();

  return await flowRepository.createFlow(db, parseResult.data);
}

/** Update an existing assessment flow's metadata, resolved by public identifier. */
export async function updateFlowService(
  _ctx: OrganisationContext,
  publicId: string,
  input: UpdateFlowInput
): Promise<AssessmentFlow> {
  const parseResult = updateAssessmentFlowSchema.safeParse(input);

  if (!parseResult.success) {
    throw new ValidationError('Invalid flow update input', {
      errors: parseResult.error.issues,
    });
  }

  const db = getDb();

  const flow = await flowRepository.findByPublicId(db, publicId);

  if (!flow) {
    throw new NotFoundError('Assessment flow', publicId);
  }

  return await flowRepository.updateFlow(db, flow.id, parseResult.data);
}

/** Deactivate an assessment flow (soft delete), resolved by public identifier. */
export async function deactivateFlowService(
  _ctx: OrganisationContext,
  publicId: string
): Promise<void> {
  const db = getDb();

  const flow = await flowRepository.findByPublicId(db, publicId);

  if (!flow) {
    throw new NotFoundError('Assessment flow', publicId);
  }

  await flowRepository.deactivateFlow(db, flow.id);
}
