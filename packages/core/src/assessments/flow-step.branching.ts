import type { FlowStepWithConfig } from './flow.repository';

/** A flow step with a read-only branching indicator for the admin surface. */
export interface AdminFlowStep extends FlowStepWithConfig {
  /** Number of branching rules configured on the step (0 = linear). */
  branchingRuleCount: number;
}

/** Number of branching rules configured on a step (0 when none). */
export function branchingRuleCount(step: FlowStepWithConfig): number {
  return step.nextStepRules?.length ?? 0;
}

/** Enrich a raw step record with its read-only branching indicator. */
export function toAdminFlowStep(step: FlowStepWithConfig): AdminFlowStep {
  return { ...step, branchingRuleCount: branchingRuleCount(step) };
}

/**
 * Whether a flow's active steps branch — any step carries navigation rules, or
 * two steps share an `order` (parallel branches). Reorder refuses when true.
 */
export function flowHasBranching(steps: FlowStepWithConfig[]): boolean {
  const hasRules = steps.some((step) => branchingRuleCount(step) > 0);
  const orders = steps.map((step) => step.order);
  const hasSharedOrder = new Set(orders).size !== orders.length;

  return hasRules || hasSharedOrder;
}
