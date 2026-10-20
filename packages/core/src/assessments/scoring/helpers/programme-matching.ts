import type { ScoringConfig, ComparisonOperator } from '@ffp/database';

import {
  COMPARISON_OPERATORS,
  DEFAULT_LOGICAL_OPERATOR,
  LOGICAL_OPERATORS,
} from '../../../constants';
import { isAssessed, type DimensionalScore } from '../../../schemas/job.schema';

type ProgrammeMapping = ScoringConfig['programmeMappings'][number];

export interface MatchedMapping {
  mapping: ProgrammeMapping;
  index: number;
}

/**
 * Find matching programme based on scores and mappings
 *
 * Evaluates programme mapping conditions against scores.
 * Returns the first matching programme (sorted by priority).
 *
 * @param dimensionalScores - Calculated dimension scores
 * @param programmeMappings - Programme mapping rules from scoring config
 * @returns Programme template ID if a match is found, null if no match
 */
export function findMatchingProgramme(
  dimensionalScores: DimensionalScore[],
  programmeMappings: ScoringConfig['programmeMappings']
): string | null {
  return (
    findMatchingMapping(dimensionalScores, programmeMappings)?.mapping.programmeTemplateId ?? null
  );
}

/** An unassessed dimension has no score, so any condition on it fails. */
export function findMatchingMapping(
  dimensionalScores: DimensionalScore[],
  programmeMappings: ScoringConfig['programmeMappings']
): MatchedMapping | null {
  const scoreMap = new Map<string, number>();

  for (const score of dimensionalScores.filter(isAssessed)) {
    scoreMap.set(score.dimensionId, score.rawScore);
  }

  const sorted = programmeMappings
    .map((mapping, index) => ({ mapping, index }))
    .sort((a, b) => (a.mapping.priority ?? 999) - (b.mapping.priority ?? 999));

  return sorted.find(({ mapping }) => evaluateMappingConditions(mapping, scoreMap)) ?? null;
}

/**
 * Evaluate if all conditions in a mapping are satisfied
 *
 * @param mapping - Programme mapping with conditions
 * @param scoreMap - Map of dimension scores
 * @returns True if all conditions are met
 */
function evaluateMappingConditions(
  mapping: ProgrammeMapping,
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
