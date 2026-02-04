import type { ScoringConfig, ComparisonOperator } from '@ffp/database';

import {
  COMPARISON_OPERATORS,
  DEFAULT_LOGICAL_OPERATOR,
  LOGICAL_OPERATORS,
} from '../../../constants';

import type { DimensionalScore } from '../../../schemas/job.schema';

/**
 * Find matching programme based on scores and mappings
 *
 * Evaluates programme mapping conditions against scores.
 * Returns the first matching programme (sorted by priority).
 *
 * @param dimensionalScores - Calculated dimension scores
 * @param programMappings - Programme mapping rules from scoring config
 * @returns Programme template ID if a match is found, null if no match
 */
export function findMatchingProgramme(
  dimensionalScores: DimensionalScore[],
  programMappings: ScoringConfig['programMappings']
): string | null {
  if (programMappings.length === 0) {
    return null;
  }

  // Build score lookup map using raw scores so programme mapping
  // conditions can be written in natural units per dimension
  // (e.g., "balance < 6" means rawScore < 6 out of maxScore 18)
  const scoreMap = new Map<string, number>();

  for (const score of dimensionalScores) {
    scoreMap.set(score.dimensionId, score.rawScore);
  }

  // Sort mappings by priority (lower number = higher priority)
  const sortedMappings = [...programMappings].sort(
    (a, b) => (a.priority ?? 999) - (b.priority ?? 999)
  );

  // Find first matching mapping
  for (const mapping of sortedMappings) {
    if (evaluateMappingConditions(mapping, scoreMap)) {
      return mapping.programTemplateId;
    }
  }

  return null;
}

/**
 * Evaluate if all conditions in a mapping are satisfied
 *
 * @param mapping - Programme mapping with conditions
 * @param scoreMap - Map of dimension scores
 * @returns True if all conditions are met
 */
function evaluateMappingConditions(
  mapping: ScoringConfig['programMappings'][0],
  scoreMap: Map<string, number>
): boolean {
  const { conditions, operator = DEFAULT_LOGICAL_OPERATOR } = mapping;

  if (conditions.length === 0) {
    return true;
  }

  const results = conditions.map((condition) => {
    const score = scoreMap.get(condition.dimension);

    if (score === undefined) {
      return false;
    }

    return evaluateCondition(score, condition.operator, condition.value);
  });

  if (operator === LOGICAL_OPERATORS.AND) {
    return results.every((r) => r);
  }

  return results.some((r) => r);
}

/**
 * Evaluate a single condition
 *
 * @param score - Actual score value
 * @param operator - Comparison operator
 * @param value - Value to compare against
 * @returns True if condition is satisfied
 */
function evaluateCondition(score: number, operator: ComparisonOperator, value: number): boolean {
  switch (operator) {
    case COMPARISON_OPERATORS.LESS_THAN:
      return score < value;
    case COMPARISON_OPERATORS.LESS_THAN_OR_EQUAL:
      return score <= value;
    case COMPARISON_OPERATORS.GREATER_THAN:
      return score > value;
    case COMPARISON_OPERATORS.GREATER_THAN_OR_EQUAL:
      return score >= value;
    case COMPARISON_OPERATORS.EQUAL:
      return score === value;
  }
}
