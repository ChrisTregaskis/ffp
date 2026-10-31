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
import * as userAssessmentRepository from './user-assessment.repository';

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

/**
 * Create a new step, appended after the flow's active steps under the flow's step lock, so a
 * create racing a delete, a reorder or another create can't reuse an order or leave a gap.
 */
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

  const step = await db.transaction(async (tx) => {
    const activeSteps = await flowStepRepository.lockActiveSteps(tx, flow.id);
    const maxOrder = Math.max(0, ...activeSteps.map((active) => active.order));

    return await flowStepRepository.createStep(tx, flow.id, maxOrder + 1, parseResult.data);
  });

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

/** Whether a step branches to `targetId` through a `goto_step` rule. */
function branchesTo(step: FlowStepWithConfig, targetId: string): boolean {
  return (step.nextStepRules ?? []).some(
    (rule) => rule.action.type === 'goto_step' && rule.action.targetStepId === targetId
  );
}

/**
 * Where a step leads when none of its rules apply, among `steps`: its default next step if
 * that is one of them, else the first at the next order (as branching resolves it), else none.
 */
function nextStepOf(step: FlowStepWithConfig, steps: FlowStepWithConfig[]): string | null {
  if (steps.some((other) => other.id === step.defaultNextStepId)) {
    return step.defaultNextStepId;
  }

  const nextTier = steps
    .filter((other) => other.order === step.order + 1)
    .sort((a, b) => a.id.localeCompare(b.id));

  return nextTier[0]?.id ?? null;
}

/**
 * Soft-delete a step, in one transaction:
 * - refused while another active step branches to it by a `goto_step` rule, which can't be
 *   rerouted without changing what the rule means;
 * - each step that leads to it by default is pointed where the removed step led (cleared where
 *   that is nowhere, or where it would lead the step to itself);
 * - the steps after it move down one order, so the flow's orders keep no gap, and so do the
 *   stored positions of open assessments after it, so members stay on their step. Not when
 *   another step shares its order, as that tier still exists.
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

  await db.transaction(async (tx) => {
    const activeSteps = await flowStepRepository.lockActiveSteps(tx, flow.id);
    const removed = activeSteps.find((candidate) => candidate.id === step.id);

    // Already removed: nothing to do, whatever still links to it
    if (!removed) {
      return;
    }

    const others = activeSteps.filter((other) => other.id !== removed.id);
    const branching = others.filter((other) => branchesTo(other, removed.id));

    if (branching.length > 0) {
      const linkingSteps = branching.map((other) => ({
        order: other.order,
        title: other.config.title,
      }));
      const named = linkingSteps.map(({ order, title }) => `step ${String(order)} "${title}"`);

      throw new ConflictError(
        `This step can't be removed because other steps branch to it: ${named.join(', ')}. ` +
          `Branching can't be changed in the admin yet.`,
        { linkingSteps }
      );
    }

    const rerouteTo = nextStepOf(removed, others);

    for (const linking of others.filter((other) => other.defaultNextStepId === removed.id)) {
      await flowStepRepository.setDefaultNextStep(
        tx,
        linking.id,
        rerouteTo === linking.id ? null : rerouteTo
      );
    }

    await flowStepRepository.deactivateStep(tx, removed.id);

    const closesGap = !others.some((other) => other.order === removed.order);
    const moved = closesGap
      ? await flowStepRepository.closeOrderGap(tx, flow.id, removed.order)
      : 0;

    // Members stored on the removed step need no move: the step that followed now holds it.
    // Nothing moved after the last step, so no member position needs to either
    if (moved > 0) {
      await userAssessmentRepository.shiftOpenAssessmentsBack(tx, flow.id, removed.order);
    }
  });
}

/**
 * Reorder a flow's active steps, in one transaction under the flow's step lock. Refuses on
 * branching flows and requires the supplied public identifiers to be exactly the flow's active
 * steps, as the lock leaves them.
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

  const reordered = await db.transaction(async (tx) => {
    const activeSteps = await flowStepRepository.lockActiveSteps(tx, flow.id);

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

    return await flowStepRepository.reorderSteps(tx, flow.id, orderedStepIds);
  });

  return reordered.map(toAdminFlowStep);
}
