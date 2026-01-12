import type { FlowStepRecord, NextStepRule } from '@ffp/database';

import { evaluateConditions, type BranchEvaluationContext } from './condition-evaluator';

import type { Warning, BranchEvaluationResult } from '../../schemas/warning.schema';

/**
 * Evaluate next step based on branching rules
 *
 * Processes the current step's branching rules against the evaluation context.
 * Returns the next step ID, any warnings to display, and termination status.
 */
export function evaluateNextStep(
  currentStep: FlowStepRecord,
  context: BranchEvaluationContext
): BranchEvaluationResult {
  const warnings: Warning[] = [];

  // If no branching rules, use default progression
  if (!currentStep.nextStepRules || currentStep.nextStepRules.length === 0) {
    return {
      nextStepId: resolveDefaultNextStep(currentStep, context.allSteps),
      warnings: [],
      shouldTerminate: false,
    };
  }

  // Sort rules by priority (lower = higher priority)
  const sortedRules = [...currentStep.nextStepRules].sort((a, b) => a.priority - b.priority);

  // Evaluate each rule in priority order
  for (const rule of sortedRules) {
    if (evaluateConditions(rule.conditions, context)) {
      const result = processRuleAction(rule, warnings, currentStep, context);

      if (result !== null) {
        return result;
      }
      // If null returned, continue to next rule (show_warning with continue)
    }
  }

  // No matching rules found - use default progression
  return {
    nextStepId: resolveDefaultNextStep(currentStep, context.allSteps),
    warnings,
    shouldTerminate: false,
  };
}

/**
 * Process a rule's action and determine if we should stop evaluation
 *
 * @returns BranchEvaluationResult if action terminates evaluation, null to continue
 */
function processRuleAction(
  rule: NextStepRule,
  warnings: Warning[],
  currentStep: FlowStepRecord,
  _context: BranchEvaluationContext
): BranchEvaluationResult | null {
  const { action } = rule;

  switch (action.type) {
    case 'goto_step':
      // Immediate navigation to target step
      return {
        nextStepId: action.targetStepId ?? null,
        warnings,
        shouldTerminate: false,
      };

    case 'show_warning':
      // Add warning to collection
      warnings.push({
        message: action.warningMessage ?? 'Warning',
        type: action.warningType ?? 'caution',
        shownAt: new Date().toISOString(),
        stepId: currentStep.id,
        triggeredBy: rule.conditions[0]?.questionSlug,
      });

      // Check if we should stop or continue after warning
      if (!action.continueAfterWarning) {
        return {
          nextStepId: null,
          warnings,
          shouldTerminate: true,
          terminationReason: action.warningMessage,
        };
      }

      // Continue evaluating other rules
      return null;

    case 'end_assessment':
      // Terminate assessment early
      return {
        nextStepId: null,
        warnings,
        shouldTerminate: true,
        terminationReason: action.earlyTerminationReason,
      };

    default:
      // Unknown action type - continue to next rule
      return null;
  }
}

/**
 * Resolve the default next step when no branching rules match
 *
 * @returns UUID of next step or null if end of flow
 */
function resolveDefaultNextStep(
  currentStep: FlowStepRecord,
  allSteps: BranchEvaluationContext['allSteps']
): string | null {
  // Use explicit default if set
  if (currentStep.defaultNextStepId) {
    return currentStep.defaultNextStepId;
  }

  // Fall back to first active step at order + 1
  const nextTierSteps = allSteps
    .filter((s) => s.order === currentStep.order + 1 && s.isActive)
    .sort((a, b) => a.id.localeCompare(b.id)); // Deterministic ordering by UUID

  return nextTierSteps[0]?.id ?? null;
}

/**
 * Create evaluation context from answers
 *
 * Helper function to build the evaluation context from raw answer data.
 */
export function createEvaluationContext(
  currentStepId: string,
  allSteps: FlowStepRecord[],
  answers: { questionSlug: string; value: string | string[] | number }[]
): BranchEvaluationContext {
  const answerMap = new Map<string, string | string[] | number>();

  for (const answer of answers) {
    answerMap.set(answer.questionSlug, answer.value);
  }

  return {
    currentStepId,
    allSteps: allSteps.map((s) => ({
      id: s.id,
      order: s.order,
      isActive: s.isActive,
      defaultNextStepId: s.defaultNextStepId,
    })),
    answers: answerMap,
  };
}
