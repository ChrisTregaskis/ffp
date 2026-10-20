import React from 'react';

import type { QuestionType } from '@ffp/core';

import { QUESTION_TYPE_FIELDS } from './type-fields';

export interface QuestionTypeFieldsProps {
  /** The type currently selected in the form, not the question's stored type */
  type: QuestionType;
}

/** The fields the selected type adds. */
export const QuestionTypeFields: React.FC<QuestionTypeFieldsProps> = ({ type }) => {
  const Fields = QUESTION_TYPE_FIELDS[type];

  return <Fields />;
};
