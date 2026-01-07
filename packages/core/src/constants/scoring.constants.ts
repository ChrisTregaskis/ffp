/**
 * Scoring Constants
 *
 * Runtime constants for assessment scoring.
 *
 * @module constants/scoring
 */

import type { ComparisonOperator, LogicalOperator } from '@ffp/database';

// ============================================================================
// RISK LEVEL THRESHOLDS
// ============================================================================

/**
 * Threshold for low risk classification (normalised score 0-100)
 *
 * Scores >= this value indicate good capacity.
 */
export const LOW_RISK_THRESHOLD = 70;

/**
 * Threshold for moderate risk classification (normalised score 0-100)
 *
 * Scores >= this value but < LOW_RISK_THRESHOLD indicate needs attention.
 * Scores < this value indicate high risk requiring intervention.
 */
export const MODERATE_RISK_THRESHOLD = 40;

// ============================================================================
// LOGICAL OPERATORS
// ============================================================================

/**
 * Logical operator constants for combining conditions
 */
export const LOGICAL_OPERATORS = {
  AND: 'and' as const satisfies LogicalOperator,
  OR: 'or' as const satisfies LogicalOperator,
} as const;

/**
 * Default logical operator when none specified
 */
export const DEFAULT_LOGICAL_OPERATOR: LogicalOperator = LOGICAL_OPERATORS.AND;

// ============================================================================
// COMPARISON OPERATORS
// ============================================================================

/**
 * Comparison operator constants for condition evaluation
 */
export const COMPARISON_OPERATORS = {
  LESS_THAN: 'lt' as const satisfies ComparisonOperator,
  LESS_THAN_OR_EQUAL: 'lte' as const satisfies ComparisonOperator,
  GREATER_THAN: 'gt' as const satisfies ComparisonOperator,
  GREATER_THAN_OR_EQUAL: 'gte' as const satisfies ComparisonOperator,
  EQUAL: 'eq' as const satisfies ComparisonOperator,
} as const;
