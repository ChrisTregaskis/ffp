import type { QuestionType, ScoreDimension } from '@ffp/core';

/** Numbers are held as strings — form inputs hold strings, so conversion happens on the way out. */
export interface QuestionOptionFormValues {
  value: string;
  label: string;
  score: string;
  /** Saved already — its value is fixed, since branching rules and past answers match on it */
  isStored: boolean;
}

export interface QuestionFormValues {
  questionText: string;
  slug: string;
  description: string;
  type: QuestionType;
  /** Empty when the question is not scored */
  scoreDimension: ScoreDimension | '';
  options: QuestionOptionFormValues[];
  required: boolean;
  min: string;
  max: string;
  maxSelections: string;
  /** Video UUID — the column the service checks */
  videoId: string;
  /** Display only: the linked video as the read resolved it */
  videoPublicId: string;
  videoTitle: string;
  /**
   * Rules this form does not edit, carried through because `validation` is
   * replaced whole on save — dropping them here would delete them.
   */
  pattern: string;
  customError: string;
}
