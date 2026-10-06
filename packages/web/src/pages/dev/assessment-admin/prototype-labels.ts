/**
 * Display labels + option lists for the assessment-admin prototype.
 * Throwaway — wellness vocabulary, British English.
 */
import type { ComparisonOperator, QuestionType, ScoreDimension } from './prototype-types';

export const QUESTION_TYPE_LABELS: Record<QuestionType, string> = {
  'single-choice': 'Single choice',
  'multi-choice': 'Multiple choice',
  numeric: 'Numeric',
  text: 'Text',
  scale: 'Scale',
  'video-response': 'Video response',
};

export const DIMENSION_LABELS: Record<ScoreDimension, string> = {
  activity: 'Activity & readiness',
  age: 'Age',
  strength: 'Strength',
  mobility: 'Mobility',
  balance: 'Balance',
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
