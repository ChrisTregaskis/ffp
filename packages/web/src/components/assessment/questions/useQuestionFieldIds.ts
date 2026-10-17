import { useId } from 'react';

import type { AssessmentQuestion } from '@ffp/core';

export interface QuestionFieldIds {
  /** The control's id, and the stem of every other id */
  questionId: string;
  /** Names the control by the question text, where nothing else labels it */
  labelId: string;
  errorId: string;
  /** Only when the question has a description */
  descriptionId: string | undefined;
  optionId: (value: string) => string;
  scaleId: (value: number) => string;
  /** The `aria-describedby` value: the description, then the error while one shows */
  describedBy: (hasError: boolean) => string | undefined;
}

/** The ids a question's controls, text and error share, unique per rendered instance. */
export const useQuestionFieldIds = (question: AssessmentQuestion): QuestionFieldIds => {
  const instanceId = useId();
  const questionId = `question-${question.id}-${instanceId}`;
  const errorId = `${questionId}-error`;
  const descriptionId = question.description ? `${questionId}-description` : undefined;

  return {
    questionId,
    labelId: `${questionId}-label`,
    errorId,
    descriptionId,
    optionId: (value) => `${questionId}-option-${value}`,
    scaleId: (value) => `${questionId}-scale-${String(value)}`,
    describedBy: (hasError) =>
      [descriptionId, hasError ? errorId : undefined].filter(Boolean).join(' ') || undefined,
  };
};
