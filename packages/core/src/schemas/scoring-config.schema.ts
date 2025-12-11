import { z } from 'zod';

import { scoreDimensionSchema } from './assessment-question.schema';

/**
 * Risk level enumeration - defines the risk classification for assessment results
 *
 * Used to categorise users based on their assessment scores:
 * - low: Low risk, suitable for standard programmes
 * - moderate: Moderate risk, may need modified programmes
 * - high: High risk, requires gentle programmes (Potentially supervised, but that falls outside scope of this APP)
 */
export const riskLevelSchema = z.enum(['low', 'moderate', 'high']);

export type RiskLevel = z.infer<typeof riskLevelSchema>;

/**
 * Risk thresholds schema - defines score thresholds for risk classification
 *
 * Used to determine risk level based on dimension scores:
 * - Score >= low threshold = low risk
 * - Score >= moderate threshold (but < low) = moderate risk
 * - Score < moderate threshold = high risk
 */
export const riskThresholdsSchema = z.object({
  /** Score threshold for low risk (score >= this value = low risk) */
  low: z.number(),
  /** Score threshold for moderate risk (score >= this value = moderate risk) */
  moderate: z.number(),
});

export type RiskThresholds = z.infer<typeof riskThresholdsSchema>;

/**
 * Dimension configuration schema - defines scoring for a single dimension
 *
 * Each dimension aggregates scores from specific questions and applies
 * optional weighting and risk thresholds.
 */
export const dimensionConfigSchema = z.object({
  /** The scoring dimension name */
  name: scoreDimensionSchema,
  /** Array of question IDs that contribute to this dimension */
  questionIds: z.array(z.string().min(1)),
  /** Maximum possible score for this dimension */
  maxScore: z.number().positive(),
  /** Weight multiplier for this dimension (default: 1) */
  weight: z.number().positive().default(1),
  /** Optional risk thresholds for this dimension */
  riskThresholds: riskThresholdsSchema.optional(),
});

export type DimensionConfig = z.infer<typeof dimensionConfigSchema>;

/**
 * Comparison operator enumeration - operators for programme mapping conditions
 */
export const comparisonOperatorSchema = z.enum(['lt', 'lte', 'gt', 'gte', 'eq']);

export type ComparisonOperator = z.infer<typeof comparisonOperatorSchema>;

/**
 * Programme mapping condition schema - single condition for programme selection
 *
 * Defines a condition that compares a dimension score against a threshold
 * to determine programme eligibility.
 */
export const programMappingConditionSchema = z.object({
  /** The scoring dimension to evaluate */
  dimension: scoreDimensionSchema,
  /** Comparison operator */
  operator: comparisonOperatorSchema,
  /** Threshold value to compare against */
  value: z.number(),
});

export type ProgramMappingCondition = z.infer<typeof programMappingConditionSchema>;

/**
 * Logical operator enumeration - combines multiple conditions
 *
 * - and: All conditions must be true
 * - or: At least one condition must be true
 */
export const logicalOperatorSchema = z.enum(['and', 'or']);

export type LogicalOperator = z.infer<typeof logicalOperatorSchema>;

/**
 * Programme mapping schema - maps assessment results to programme recommendations
 *
 * Defines rules for automatically recommending programmes based on
 * assessment scores. Multiple conditions can be combined with logical operators.
 * Higher priority mappings are evaluated first.
 */
export const programMappingSchema = z.object({
  /** Array of conditions that must be satisfied */
  conditions: z.array(programMappingConditionSchema),
  /** Logical operator to combine conditions (default: 'and') */
  operator: logicalOperatorSchema.default('and'),
  /** ID of the programme template to recommend when conditions match */
  programTemplateId: z.string().min(1),
  /** Priority for evaluation order (higher = checked first, default: 0) */
  priority: z.number().int().default(0),
});

export type ProgramMapping = z.infer<typeof programMappingSchema>;

/**
 * Scoring configuration schema - complete scoring setup for an assessment template
 *
 * Defines how assessment responses are scored across dimensions and
 * how scores map to programme recommendations.
 */
export const scoringConfigSchema = z.object({
  /** Array of dimension configurations for multi-dimensional scoring */
  dimensions: z.array(dimensionConfigSchema),
  /** Array of programme mappings for automatic recommendations */
  programMappings: z.array(programMappingSchema),
});

export type ScoringConfig = z.infer<typeof scoringConfigSchema>;
