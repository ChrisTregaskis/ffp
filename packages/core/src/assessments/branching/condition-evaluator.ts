import type {
  BranchCondition,
  ComparisonOperator,
  FlowStepRecord,
  ScoreDimension,
} from '@ffp/database';

/**
 * Context for evaluating branch conditions
 *
 * Contains all data needed to evaluate conditions:
 * - answers: Map of question slug to answer value
 * - dimensionScores: Map of dimension name to calculated score (optional)
 */
export interface BranchEvaluationContext {
  /** Current step ID being evaluated */
  currentStepId: string;

  /** All steps in the flow (for navigation) */
  allSteps: Pick<FlowStepRecord, 'id' | 'order' | 'isActive' | 'defaultNextStepId'>[];

  /** Map of question slug to answer value */
  answers: Map<string, string | string[] | number>;

  /** Map of dimension name to calculated score (optional, for post-scoring branching) */
  dimensionScores?: Map<ScoreDimension, number>;
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
  switch (condition.type) {
    case 'answer_value':
      return evaluateAnswerCondition(condition, context.answers);

    case 'dimension_score':
      return evaluateDimensionCondition(condition, context.dimensionScores);

    case 'aggregate':
      return evaluateAggregateCondition(condition, context);

    default:
      // Unknown condition type - fail safe (don't match)
      return false;
  }
}

/**
 * Evaluate an answer_value condition
 *
 * Checks if a specific question has a specific answer value.
 * Supports both single values and arrays of values (matches if any match).
 */
function evaluateAnswerCondition(
  condition: BranchCondition,
  answers: Map<string, string | string[] | number>
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

/**
 * Evaluate a dimension_score condition
 *
 * Compares a dimension score against a threshold using the specified operator.
 * Only works if dimensionScores are provided in context (post-scoring).
 *
 * @param condition - The condition with dimension, operator, and value
 * @param dimensionScores - Map of dimension name to score
 */
function evaluateDimensionCondition(
  condition: BranchCondition,
  dimensionScores?: Map<ScoreDimension, number>
): boolean {
  const { dimension, operator, value } = condition;

  if (!dimension || !operator || value === undefined || !dimensionScores) {
    return false;
  }

  const score = dimensionScores.get(dimension);

  if (score === undefined) {
    return false;
  }

  return compareValues(score, operator, value);
}

/**
 * Evaluate an aggregate condition
 *
 * Reserved for future use - aggregate calculations across dimensions.
 * Currently not implemented (returns false).
 *
 * @param condition - The condition configuration
 * @param context - Full evaluation context
 */
function evaluateAggregateCondition(
  _condition: BranchCondition,
  _context: BranchEvaluationContext
): boolean {
  // TODO: Implement aggregate conditions in future
  // Examples: total score > X, average score < Y, etc.
  return false;
}

/**
 * Compare two values using the specified operator
 *
 * @param actual - The actual value
 * @param operator - Comparison operator (lt, lte, gt, gte, eq)
 * @param expected - The expected/threshold value
 */
function compareValues(actual: number, operator: ComparisonOperator, expected: number): boolean {
  switch (operator) {
    case 'lt':
      return actual < expected;
    case 'lte':
      return actual <= expected;
    case 'gt':
      return actual > expected;
    case 'gte':
      return actual >= expected;
    case 'eq':
      return actual === expected;
  }
}
