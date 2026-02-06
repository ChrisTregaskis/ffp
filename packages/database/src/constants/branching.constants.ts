import type { ScoreDimension } from './question.constants';
import type { ComparisonOperator } from '../types/question.types';

/**
 * Branch condition types
 *
 * - dimension_score: Based on calculated dimension score (e.g., "if strength < 4")
 * - answer_value: Based on specific answer to a question (e.g., "if pain-location = 'shoulder'")
 * - aggregate: Based on aggregate calculations (e.g., "if total score > 50")
 */
export const BRANCH_CONDITION_TYPES = ['dimension_score', 'answer_value', 'aggregate'] as const;

export type BranchConditionType = (typeof BRANCH_CONDITION_TYPES)[number];

/**
 * Branch action types
 *
 * - goto_step: Navigate to a specific step by UUID
 * - show_warning: Display a warning message (optionally continue or stop)
 * - end_assessment: Terminate the assessment early
 */
export const BRANCH_ACTION_TYPES = ['goto_step', 'show_warning', 'end_assessment'] as const;

export type BranchActionType = (typeof BRANCH_ACTION_TYPES)[number];

/**
 * Warning severity types for show_warning action
 *
 * - info: Informational message, no concern
 * - caution: User should be aware, may need attention
 * - seek_medical: User should consult a medical professional
 */
export const WARNING_TYPES = ['info', 'caution', 'seek_medical'] as const;

export type WarningType = (typeof WARNING_TYPES)[number];

/**
 * Condition for branching evaluation
 *
 * All conditions in a rule must match (AND logic).
 * For OR logic, create multiple rules with different priorities.
 */
export interface BranchCondition {
  /** Type of condition to evaluate */
  type: BranchConditionType;

  /** For dimension_score: Which dimension to check */
  dimension?: ScoreDimension;

  /** Comparison operator for numeric comparisons */
  operator?: ComparisonOperator;

  /** Value to compare against (for dimension_score, aggregate) */
  value?: number;

  /** For answer_value: Question slug to check */
  questionSlug?: string;

  /** For answer_value: Expected answer value(s) */
  answerValue?: string | string[];
}

/**
 * Action to take when branch conditions match
 */
export interface BranchAction {
  /** Type of action to perform */
  type: BranchActionType;

  /** For goto_step: UUID of the target step */
  targetStepId?: string;

  /** For show_warning: Message to display */
  warningMessage?: string;

  /** For show_warning: Severity level */
  warningType?: WarningType;

  /** For show_warning: Whether user can continue after seeing warning */
  continueAfterWarning?: boolean;

  /** For end_assessment: Reason for early termination */
  earlyTerminationReason?: string;
}

/**
 * Rule for conditional step navigation
 *
 * Rules are evaluated in priority order (lower = higher priority).
 * First matching rule's action is executed.
 * If no rules match, default progression is used.
 */
export interface NextStepRule {
  /** Priority for rule evaluation (lower = evaluated first) */
  priority: number;

  /** Conditions that must ALL match for this rule to apply */
  conditions: BranchCondition[];

  /** Action to take when conditions match */
  action: BranchAction;
}

/**
 * Warning record stored in user_assessments.warnings_shown
 *
 * Tracks warnings shown to users during assessment for:
 * - Audit trail (which warnings were displayed)
 * - Duplicate prevention (don't show same warning twice)
 * - Assessment history (medical review recommendations)
 */
export interface AssessmentWarning {
  /** Warning message displayed to user */
  message: string;

  /** Severity level of the warning */
  type: WarningType;

  /** ISO timestamp when warning was shown */
  shownAt: string;

  /** Step ID where warning was triggered (optional for context) */
  stepId?: string;

  /** Question slug that triggered the warning (optional for context) */
  triggeredBy?: string;
}
