import type { AnswerValue, FlowStepRecord, NextStepRule } from '@ffp/database';

import { createSystemLogger } from '../../lib/logger';

import { evaluateConditions, type BranchEvaluationContext } from './condition-evaluator';

import type { Warning, BranchEvaluationResult } from '../../schemas/warning.schema';

const logger = createSystemLogger('branch-evaluator');

/**
 * Whether a link's target is an active step of the flow. A link to a removed or unknown step is
 * treated as absent, and logged, so the member is never sent to a step they can't be shown.
 */
function isActiveTarget(
  currentStep: FlowStepRecord,
  targetStepId: string | undefined,
  link: 'default' | 'goto_step',
  allSteps: BranchEvaluationContext['allSteps']
): targetStepId is string {
  if (allSteps.some((s) => s.id === targetStepId && s.isActive)) {
    return true;
  }

  logger.warn('Branching target is not an active step of the flow; falling back', {
    stepId: currentStep.id,
    targetStepId,
    link,
  });

  return false;
}

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
  context: BranchEvaluationContext
): BranchEvaluationResult | null {
  const { action } = rule;

  switch (action.type) {
    case 'goto_step':
      // Immediate navigation to target step; a target outside the flow skips the rule
      if (!isActiveTarget(currentStep, action.targetStepId, 'goto_step', context.allSteps)) {
        return null;
      }

      return {
        nextStepId: action.targetStepId,
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
  // Use explicit default if set and still an active step of the flow
  if (
    currentStep.defaultNextStepId &&
    isActiveTarget(currentStep, currentStep.defaultNextStepId, 'default', allSteps)
  ) {
    return currentStep.defaultNextStepId;
  }

  // Fall back to first active step at order + 1
  const nextTierSteps = allSteps
    .filter((s) => s.order === currentStep.order + 1 && s.isActive)
    .sort((a, b) => a.id.localeCompare(b.id)); // Deterministic ordering by UUID

  return nextTierSteps[0]?.id ?? null;
}

/** Answers keyed by question slug, the form branching conditions name them in */
export type BranchingAnswers = { questionSlug: string; value: AnswerValue }[];

/**
 * Create evaluation context from answers
 *
 * Helper function to build the evaluation context from raw answer data.
 */
export function createEvaluationContext(
  currentStepId: string,
  allSteps: FlowStepRecord[],
  answers: BranchingAnswers
): BranchEvaluationContext {
  const answerMap = new Map<string, AnswerValue>();

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
