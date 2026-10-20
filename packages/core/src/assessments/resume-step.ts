import type { FlowStepRecord } from '@ffp/database';
import { TEMPLATE_LINKED_STEP_TYPES } from '@ffp/database/constants';

/**
 * The step an unsubmitted assessment may be stored at or resumed on: `order` itself, unless it
 * lies past the flow's last question step, in which case that question step. Only a submit moves
 * a member beyond it, so a stored position past it (the results step, say) would resume an
 * unsubmitted assessment somewhere it cannot be finished.
 */
export function toResumableStep(
  order: number,
  steps: Pick<FlowStepRecord, 'order' | 'type'>[]
): number {
  const lastQuestionStep = Math.max(
    ...steps
      .filter((step) => TEMPLATE_LINKED_STEP_TYPES.includes(step.type))
      .map((step) => step.order)
  );

  return Number.isFinite(lastQuestionStep) ? Math.min(order, lastQuestionStep) : order;
}
