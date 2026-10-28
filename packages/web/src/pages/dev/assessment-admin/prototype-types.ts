/**
 * Throwaway UX-prototype types for the assessment-admin authoring surface.
 *
 * These mirror the real catalogue shapes (see packages/core/src/assessments/CLAUDE.md
 * and packages/database/src/types) but are defined locally so the prototype stays
 * self-contained: no @ffp/core / @ffp/database imports, no network, no DB.
 *
 * NOTE: disposable. The real admin UI lives under pages/protected/admin.
 */

export const QUESTION_TYPES = [
  'single-choice',
  'multi-choice',
  'numeric',
  'text',
  'scale',
  'video-response',
] as const;
export type QuestionType = (typeof QUESTION_TYPES)[number];

export const SCORE_DIMENSIONS = ['activity', 'age', 'strength', 'mobility', 'balance'] as const;
export type ScoreDimension = (typeof SCORE_DIMENSIONS)[number];

export interface QuestionOption {
  value: string;
  label: string;
  score?: number;
}

export interface QuestionValidation {
  required?: boolean;
  min?: number;
  max?: number;
  pattern?: string;
  customError?: string;
}

export interface PrototypeQuestion {
  id: string;
  publicId: string;
  slug: string;
  type: QuestionType;
  questionText: string;
  description?: string;
  options?: QuestionOption[];
  validation?: QuestionValidation;
  scoreDimension?: ScoreDimension | null;
  /** A scoring effect that isn't a dimension (e.g. age driving the level bump). */
  scoringNote?: string;
  isActive: boolean;
}
