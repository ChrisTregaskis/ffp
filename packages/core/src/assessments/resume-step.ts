import type { FlowStepRecord } from '@ffp/database';
import { TEMPLATE_LINKED_STEP_TYPES } from '@ffp/database/constants';

/**
 * The step an unsubmitted assessment may be stored at or resumed on, given the flow's active
 * steps: `order` itself, unless it lies past the flow's last question step, in which case that
 * question step. Only a submit moves a member beyond it, so a stored position past it (the results
 * step, say) would resume an unsubmitted assessment somewhere it cannot be finished.
 *
 * An order no active step holds (one a step removed before deletes closed the gap) moves on to
 * the next active step, or back to the last one when none follows. A flow with no active steps
 * leaves `order` as it is.
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
  const capped = Number.isFinite(lastQuestionStep) ? Math.min(order, lastQuestionStep) : order;
  const orders = steps.map((step) => step.order);

  if (orders.length === 0 || orders.includes(capped)) {
    return capped;
  }

  const later = orders.filter((stepOrder) => stepOrder > capped);

  return later.length > 0 ? Math.min(...later) : Math.max(...orders);
}
