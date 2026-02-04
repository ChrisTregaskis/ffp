import { z } from 'zod';

import type { ScoreDimension } from '../constants/question.constants';

/**
 * Question option for choice-based questions (single-choice, multi-choice)
 */
export interface QuestionOption {
  /** Unique value identifier for this option */
  value: string;
  /** Display label shown to users */
  label: string;
  /** Optional score contribution when this option is selected */
  score?: number;
}

/**
 * Validation rules for question answers
 */
export interface QuestionValidation {
  /** Whether an answer is required (defaults to true if not specified) */
  required?: boolean;
  /** Minimum value for numeric/scale questions, or min length for text */
  min?: number;
  /** Maximum value for numeric/scale questions, or max length for text */
  max?: number;
  /** Regex pattern for text validation */
  pattern?: string;
  /** Custom error message when validation fails */
  customError?: string;
}

/**
 * Template-specific question configuration overrides
 *
 * Allows templates to customise question display without duplicating the question.
 * Original question data is used for any fields not overridden.
 */
export interface ConfigOverrides {
  /** Override the question text for this template */
  questionText?: string;
  /** Override the description for this template */
  description?: string;
  /** Override validation rules for this template */
  validation?: QuestionValidation;
}

/**
 * Zod schema for answer values - single source of truth
 *
 * Supported value types:
 * - single-choice: string (e.g., "reduce_pain")
 * - multi-choice: string[] (e.g., ["none", "diabetes"])
 * - numeric/scale: number (e.g., 5, 7)
 * - text: string (e.g., "User's free text response")
 * - video-response: boolean (e.g., true when video completed)
 */
export const answerValueSchema = z.union([
  z.string(),
  z.number(),
  z.boolean(),
  z.array(z.string()),
]);

/** Answer value type - inferred from schema */
export type AnswerValue = z.infer<typeof answerValueSchema>;

/**
 * Question with template-specific configuration
 *
 * Represents a question as returned when joining with template_questions,
 * including display order and any config overrides from the template.
 *
 * This is the primary type used when fetching questions for a template,
 * as it includes the template-specific configuration.
 */
export interface QuestionWithConfig {
  id: string;
  slug: string;
  type: string;
  questionText: string;
  description: string | null;
  options: QuestionOption[] | null;
  validation: QuestionValidation | null;
  videoId: string | null;
  scoreDimension: string | null;
  isActive: boolean;
  /** Display order within the template (1-based) */
  displayOrder: number;
  /** Template-specific overrides (merged on read by caller if needed) */
  configOverrides: ConfigOverrides | null;
}

/** Comparison operators for scoring conditions */
export type ComparisonOperator = 'lt' | 'lte' | 'gt' | 'gte' | 'eq';

/** Logical operators for combining conditions */
export type LogicalOperator = 'and' | 'or';

/** Risk level thresholds for dimension scores */
export interface RiskThresholds {
  low: number;
  moderate: number;
}

/** Configuration for a single scoring dimension */
export interface DimensionConfig {
  /** Name of the dimension being scored */
  name: ScoreDimension;
  /** Question IDs (UUIDs) that contribute to this dimension */
  questionIds: string[];
  /** Maximum possible score for this dimension */
  maxScore: number;
  /** Weight multiplier for this dimension (optional) */
  weight?: number;
  /** Thresholds for risk categorisation (optional) */
  riskThresholds?: RiskThresholds;
}

/** Condition for programme mapping */
export interface ProgramMappingCondition {
  /** Dimension to evaluate */
  dimension: ScoreDimension;
  /** Comparison operator */
  operator: ComparisonOperator;
  /** Value to compare against */
  value: number;
}

/** Mapping from scores to programme recommendations */
export interface ProgramMapping {
  /** Conditions that must be met */
  conditions: ProgramMappingCondition[];
  /** How to combine conditions (default: 'and') */
  operator?: LogicalOperator;
  /** ID of the programme template to recommend */
  programTemplateId: string;
  /** Priority for selecting between matching mappings */
  priority?: number;
}

/**
 * Scoring configuration for an assessment template
 *
 * Defines how responses are scored across dimensions and
 * how scores map to programme recommendations.
 */
export interface ScoringConfig {
  /** Scoring dimensions and their configurations */
  dimensions: DimensionConfig[];
  /** Mappings from scores to programme recommendations */
  programMappings: ProgramMapping[];
}
