import { getDb, type DbClient } from '@ffp/database';

import { type OrganisationContext } from '../lib/context';
import { ConflictError, NotFoundError, ValidationError } from '../lib/errors';
import {
  createFlowStepSchema,
  updateFlowStepSchema,
  reorderFlowStepsSchema,
} from '../schemas/assessment-flow.schema';

import { flowHasBranching, toAdminFlowStep, type AdminFlowStep } from './flow-step.branching';
import * as flowStepRepository from './flow-step.repository';
import * as flowRepository from './flow.repository';
import { findTemplateById } from './template.repository';

import type { AssessmentFlow } from './flow.repository';

export type { AdminFlowStep };

/**
 * Resolve a flow by public identifier or throw 404. Not filtered on `isActive`:
 * editing steps on a deactivated flow is allowed (consistent with the flow
 * update/get surface, and lets a flow be fixed up before reactivation).
 */
async function resolveFlow(db: DbClient, flowPublicId: string): Promise<AssessmentFlow> {
  const flow = await flowRepository.findByPublicId(db, flowPublicId);

  if (!flow) {
    throw new NotFoundError('Assessment flow', flowPublicId);
  }

  return flow;
}

/** Belt-and-braces over the FK: a linked template must exist and be active. */
async function assertTemplateActive(db: DbClient, templateId: string | undefined): Promise<void> {
  if (!templateId) {
    return;
  }

  const template = await findTemplateById(db, templateId);

  if (!template?.isActive) {
    throw new ValidationError('Linked assessment template not found or inactive', { templateId });
  }
}

/** Create a new step, appended to the end of the flow's active sequence. */
export async function createStepService(
  _ctx: OrganisationContext,
  flowPublicId: string,
  input: unknown
): Promise<AdminFlowStep> {
  const parseResult = createFlowStepSchema.safeParse(input);

  if (!parseResult.success) {
    throw new ValidationError('Invalid flow step input', { errors: parseResult.error.issues });
  }

  const db = getDb();
  const flow = await resolveFlow(db, flowPublicId);

  await assertTemplateActive(db, parseResult.data.templateId);

  const maxOrder = await flowStepRepository.findMaxOrderForFlow(db, flow.id);
  const step = await flowStepRepository.createStep(db, flow.id, maxOrder + 1, parseResult.data);

  return toAdminFlowStep(step);
}

/** Update a step's type, template link and/or config. Branching is preserved. */
export async function updateStepService(
  _ctx: OrganisationContext,
  flowPublicId: string,
  stepPublicId: string,
  input: unknown
): Promise<AdminFlowStep> {
  const parseResult = updateFlowStepSchema.safeParse(input);

  if (!parseResult.success) {
    throw new ValidationError('Invalid flow step update input', {
      errors: parseResult.error.issues,
    });
  }

  const db = getDb();
  const flow = await resolveFlow(db, flowPublicId);

  const step = await flowStepRepository.findStepByPublicId(db, stepPublicId);

  if (!step || step.flowId !== flow.id) {
    throw new NotFoundError('Flow step', stepPublicId);
  }

  await assertTemplateActive(db, parseResult.data.templateId);

  const updated = await flowStepRepository.updateStep(db, step.id, parseResult.data);

  if (!updated) {
    throw new NotFoundError('Flow step', stepPublicId);
  }

  return toAdminFlowStep(updated);
}

/** Soft-delete a step. Order gaps are left as-is (no renumber). */
export async function deleteStepService(
  _ctx: OrganisationContext,
  flowPublicId: string,
  stepPublicId: string
): Promise<void> {
  const db = getDb();
  const flow = await resolveFlow(db, flowPublicId);

  const step = await flowStepRepository.findStepByPublicId(db, stepPublicId);

  if (!step || step.flowId !== flow.id) {
    throw new NotFoundError('Flow step', stepPublicId);
  }

  await flowStepRepository.deactivateStep(db, step.id);
}

/**
 * Reorder a flow's active steps. Refuses on branching flows and requires the
 * supplied public identifiers to be exactly the flow's active steps.
 */
export async function reorderStepsService(
  _ctx: OrganisationContext,
  flowPublicId: string,
  input: unknown
): Promise<AdminFlowStep[]> {
  const parseResult = reorderFlowStepsSchema.safeParse(input);

  if (!parseResult.success) {
    throw new ValidationError('Invalid reorder input', { errors: parseResult.error.issues });
  }

  const db = getDb();
  const flow = await resolveFlow(db, flowPublicId);

  const activeSteps = await flowRepository.findStepsByFlowId(db, flow.id);

  if (flowHasBranching(activeSteps)) {
    throw new ConflictError(
      'This flow contains branching and cannot be reordered. Reordering is only available for linear flows.'
    );
  }

  const { orderedStepPublicIds } = parseResult.data;

  // Distinctness matters: `flow_steps.order` is non-unique, so a duplicate id
  // would reassign one step twice and silently leave another unmoved.
  if (new Set(orderedStepPublicIds).size !== orderedStepPublicIds.length) {
    throw new ValidationError('Step IDs must be unique');
  }

  if (orderedStepPublicIds.length !== activeSteps.length) {
    throw new ValidationError(
      `Expected ${String(activeSteps.length)} step IDs but received ${String(orderedStepPublicIds.length)}`
    );
  }

  const stepIdByPublicId = new Map(activeSteps.map((step) => [step.publicId, step.id]));

  // Resolve each public identifier to its UUID, failing if any does not belong
  // to the flow's active steps.
  const orderedStepIds: string[] = [];

  for (const publicId of orderedStepPublicIds) {
    const stepId = stepIdByPublicId.get(publicId);

    if (!stepId) {
      throw new ValidationError('One or more step IDs do not belong to this flow');
    }

    orderedStepIds.push(stepId);
  }

  const reordered = await flowStepRepository.reorderSteps(db, flow.id, orderedStepIds);

  return reordered.map(toAdminFlowStep);
}
