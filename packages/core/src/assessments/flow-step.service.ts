import { getDb, type DbClient } from '@ffp/database';

import { type OrganisationContext } from '../lib/context';
import { ConflictError, NotFoundError, ValidationError } from '../lib/errors';
import {
  createFlowStepSchema,
  updateFlowStepSchema,
  reorderFlowStepsSchema,
  TEMPLATE_LINKED_STEP_TYPES,
  type FlowStepType,
  type UpdateFlowStepInput,
} from '../schemas/assessment-flow.schema';

import { resolveOrderedChildIds } from './child-payload';
import { flowHasBranching, toAdminFlowStep, type AdminFlowStep } from './flow-step.branching';
import * as flowStepRepository from './flow-step.repository';
import * as flowRepository from './flow.repository';
import { findTemplateById } from './template.repository';

import type { AssessmentFlow, FlowStepWithConfig } from './flow.repository';

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
async function assertTemplateActive(
  db: DbClient,
  templateId: string | null | undefined
): Promise<void> {
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

  // A new step has no stored row, so the payload is the whole merged shape
  assertMergedTemplateLink({ type: parseResult.data.type, templateId: null }, parseResult.data);

  const db = getDb();
  const flow = await resolveFlow(db, flowPublicId);

  await assertTemplateActive(db, parseResult.data.templateId);

  const maxOrder = await flowStepRepository.findMaxOrderForFlow(db, flow.id);
  const step = await flowStepRepository.createStep(db, flow.id, maxOrder + 1, parseResult.data);

  return toAdminFlowStep(step);
}

/**
 * Drop the template link a non-linking type has no use for. Clearing beats
 * rejecting — setting the type is deliberate — and a link the payload sets
 * explicitly still wins. Deliberately not conditioned on the type *changing*:
 * the rows most in need of clearing are those already storing a stale link
 * under a non-linking type, so every save that resends the type self-heals.
 */
function applyTypeChangeCleanup(update: UpdateFlowStepInput): UpdateFlowStepInput {
  const nextType = update.type;

  if (!nextType || TEMPLATE_LINKED_STEP_TYPES.includes(nextType)) {
    return update;
  }

  if (update.templateId !== undefined) {
    return update;
  }

  return { ...update, templateId: null };
}

/**
 * Judge the row the update will produce, not the payload: a partial need not
 * resend the type or the link, so only the merged pair shows whether a step
 * that renders a template would be left without one. Mirrors
 * `assertMergedShape` in the question service.
 */
function assertMergedTemplateLink(
  stored: { type: FlowStepType; templateId: string | null },
  update: UpdateFlowStepInput
): void {
  const mergedType = update.type ?? stored.type;
  // `??` would be wrong on a clearable field: an explicit `null` means clear,
  // and must not fall through to the stored value.
  const mergedTemplateId = update.templateId !== undefined ? update.templateId : stored.templateId;

  if (TEMPLATE_LINKED_STEP_TYPES.includes(mergedType) && !mergedTemplateId) {
    throw new ValidationError('A step of this type must link an assessment template', {
      type: mergedType,
    });
  }
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

  const update = applyTypeChangeCleanup(parseResult.data);

  assertMergedTemplateLink(step, update);

  const updated = await flowStepRepository.updateStep(db, step.id, update);

  if (!updated) {
    throw new NotFoundError('Flow step', stepPublicId);
  }

  return toAdminFlowStep(updated);
}

/** Whether a step leads to `targetId`, by its default next step or a `goto_step` rule. */
function leadsTo(step: FlowStepWithConfig, targetId: string): boolean {
  return (
    step.defaultNextStepId === targetId ||
    (step.nextStepRules ?? []).some(
      (rule) => rule.action.type === 'goto_step' && rule.action.targetStepId === targetId
    )
  );
}

/**
 * Soft-delete a step. Order gaps are left as-is (no renumber). Refused while another active
 * step leads to it, so branching never hands a member a removed step.
 */
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

  // Already removed: nothing to do, whatever still links to it
  if (!step.isActive) {
    return;
  }

  const activeSteps = await flowRepository.findStepsByFlowId(db, flow.id);
  const linkingSteps = activeSteps
    .filter((other) => other.id !== step.id && leadsTo(other, step.id))
    .map((other) => ({ order: other.order, title: other.config.title }));

  if (linkingSteps.length > 0) {
    const named = linkingSteps.map(({ order, title }) => `step ${String(order)} "${title}"`);

    throw new ConflictError(
      `This step can't be removed because other steps lead to it: ${named.join(', ')}.`,
      { linkingSteps }
    );
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

  // Distinctness matters here beyond the usual: `flow_steps.order` is
  // non-unique, so a duplicate id would reassign one step twice and silently
  // leave another unmoved.
  const orderedStepIds = resolveOrderedChildIds(
    parseResult.data.orderedStepPublicIds,
    activeSteps,
    {
      noun: 'Step',
      strangerMessage: 'One or more step IDs do not belong to this flow',
    }
  );

  const reordered = await flowStepRepository.reorderSteps(db, flow.id, orderedStepIds);

  return reordered.map(toAdminFlowStep);
}
