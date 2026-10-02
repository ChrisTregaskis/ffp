import React from 'react';

import { MaxSelectionsField } from './MaxSelectionsField';
import { QuestionOptionsField } from './QuestionOptionsField';

export const MultiChoiceFields: React.FC = () => (
  <>
    <QuestionOptionsField />
    <MaxSelectionsField />
  </>
);
