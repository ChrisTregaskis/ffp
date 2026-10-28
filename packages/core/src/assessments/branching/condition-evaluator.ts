import type { AnswerValue, BranchCondition, FlowStepRecord } from '@ffp/database';

/**
 * Context for evaluating branch conditions
 *
 * Contains all data needed to evaluate conditions:
 * - answers: Map of question slug to answer value
 */
export interface BranchEvaluationContext {
  /** Current step ID being evaluated */
  currentStepId: string;

  /** All steps in the flow (for navigation) */
  allSteps: Pick<FlowStepRecord, 'id' | 'order' | 'isActive' | 'defaultNextStepId'>[];

  /** Map of question slug to answer value */
  answers: Map<string, AnswerValue>;
}

/**
 * Evaluate all conditions (AND logic)
 *
 * All conditions must match for the rule to apply.
 * For OR logic, create multiple rules with different priorities.
 * @returns true if ALL conditions match, false otherwise
 */
export function evaluateConditions(
  conditions: BranchCondition[],
  context: BranchEvaluationContext
): boolean {
  // Empty conditions array = always matches (fallback rule)
  if (conditions.length === 0) {
    return true;
  }

  return conditions.every((condition) => evaluateCondition(condition, context));
}

/**
 * Evaluate a single condition
 *
 * @returns true if condition matches, false otherwise
 */
function evaluateCondition(condition: BranchCondition, context: BranchEvaluationContext): boolean {
  // Stored rules are unchecked JSON, so one may carry a type since removed; it never matches
  const type: string = condition.type;

  return type === 'answer_value' && evaluateAnswerCondition(condition, context.answers);
}

/**
 * Evaluate an answer_value condition
 *
 * Checks if a specific question has a specific answer value.
 * Supports both single values and arrays of values (matches if any match).
 */
function evaluateAnswerCondition(
  condition: BranchCondition,
  answers: Map<string, AnswerValue>
): boolean {
  const { questionSlug, answerValue } = condition;

  if (!questionSlug || answerValue === undefined) {
    return false;
  }

  const actualAnswer = answers.get(questionSlug);

  if (actualAnswer === undefined) {
    return false;
  }

  // Handle array of expected values (matches if actual matches any)
  if (Array.isArray(answerValue)) {
    if (Array.isArray(actualAnswer)) {
      // Both are arrays - check for any intersection
      return answerValue.some((expected) =>
        actualAnswer.some((actual) => String(actual) === String(expected))
      );
    }

    return answerValue.some((expected) => String(actualAnswer) === String(expected));
  }

  // Handle single expected value
  if (Array.isArray(actualAnswer)) {
    // Actual is array, expected is single - check if expected is in array
    return actualAnswer.some((actual) => String(actual) === String(answerValue));
  }

  // Both are single values
  return String(actualAnswer) === String(answerValue);
}
