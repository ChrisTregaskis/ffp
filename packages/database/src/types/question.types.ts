/**
 * Question-related types - Single source of truth for question JSONB structures
 *
 * These types are shared between:
 * - @ffp/database: JSONB column typing in Drizzle schemas
 * - @ffp/core: Zod validation schemas (can import and use for type inference)
 *
 * This avoids circular dependencies since @ffp/database has no dependencies
 * on other @ffp/* packages.
 */

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
 * Answer value structure for user assessment answers
 *
 * Flexible structure to accommodate all question types:
 * - single-choice: { selected: string }
 * - multi-choice: { selected: string[] }
 * - numeric: { value: number }
 * - text: { text: string }
 * - scale: { value: number }
 * - video-response: { videoId: string, thumbnailUrl?: string }
 */
export type AnswerValue = Record<string, unknown>;
