/**
 * Display labels + option lists for the assessment-admin prototype.
 * Throwaway — wellness vocabulary, British English.
 */
import type {
  ComparisonOperator,
  FlowStepType,
  QuestionType,
  ScoreDimension,
} from './prototype-types';

export const QUESTION_TYPE_LABELS: Record<QuestionType, string> = {
  'single-choice': 'Single choice',
  'multi-choice': 'Multiple choice',
  numeric: 'Numeric',
  text: 'Text',
  scale: 'Scale',
  'video-response': 'Video response',
};

export const STEP_TYPE_LABELS: Record<FlowStepType, string> = {
  intro: 'Intro',
  questions: 'Questions',
  transition: 'Transition',
  'video-assessment': 'Video assessment',
  results: 'Results',
  'programme-overview': 'Programme overview',
};

/** Step types that link to a template */
export const TEMPLATE_LINKED_STEP_TYPES: FlowStepType[] = ['questions', 'video-assessment'];

export const DIMENSION_LABELS: Record<ScoreDimension, string> = {
  strength: 'Strength',
  balance: 'Balance',
  mobility: 'Mobility',
  pain: 'Comfort', // wellness-neutral framing of the legacy "pain" dimension
  general: 'Activity & readiness',
};

export const OPERATOR_LABELS: Record<ComparisonOperator, string> = {
  lt: 'is less than',
  lte: 'is at most',
  gt: 'is greater than',
  gte: 'is at least',
  eq: 'equals',
};

/** Question types that carry a choice-option list */
export const CHOICE_TYPES: QuestionType[] = ['single-choice', 'multi-choice'];

/**
 * Map a theme colour token to the CSS variable the Icon component expects
 * (Icon `colour` takes CSS values, not the Text theme-token union).
 */
export const iconVar = (token: string): `var(${string})` => `var(--color-${token})`;
