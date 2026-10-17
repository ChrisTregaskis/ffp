import type { AdminFlowStepView } from '@ffp/core';

/**
 * Branching means any step carries navigation rules, or two share an `order`.
 *
 * Duplicates the server's rule so the move controls can be disabled rather than
 * offered and always refused. The server stays authoritative, so drift shows as
 * a control offered and refused, never as a bad write.
 */
export const flowStepsBranch = (steps: AdminFlowStepView[]): boolean => {
  const hasRules = steps.some((step) => step.branchingRuleCount > 0);
  const orders = steps.map((step) => step.order);

  return hasRules || new Set(orders).size !== orders.length;
};

/** Shares its `order` with another step — a parallel branch. */
export const stepSharesOrder = (step: AdminFlowStepView, steps: AdminFlowStepView[]): boolean =>
  steps.some((other) => other.publicId !== step.publicId && other.order === step.order);
