import React from 'react';

import type { AdminQuestionDetail, QuestionType } from '@ffp/core';

import { StaticAlert } from '@web/components/molecules';
import { QUESTION_TYPE_LABELS } from '@web/components/questions';

import { describeTypeChangeLoss, describeTypeChangeNotes } from './question-type-change';

export interface QuestionTypeChangeWarningProps {
  stored: AdminQuestionDetail;
  nextType: QuestionType;
}

/** Says what saving under a different type will remove from the stored question. */
export const QuestionTypeChangeWarning: React.FC<QuestionTypeChangeWarningProps> = ({
  stored,
  nextType,
}) => {
  const losses = describeTypeChangeLoss(stored, nextType);
  const notes = describeTypeChangeNotes(stored, nextType);

  if (losses.length === 0 && notes.length === 0) {
    return null;
  }

  const removal =
    losses.length > 0
      ? `Saving as ${QUESTION_TYPE_LABELS[nextType].toLowerCase()} removes ${losses.join(', ')}.`
      : '';

  return (
    <StaticAlert
      variant="warning"
      className="mb-4"
      message={[removal, ...notes].join(' ').trim()}
    />
  );
};
