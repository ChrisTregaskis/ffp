import React from 'react';

import { QuestionVideoField } from './QuestionVideoField';
import { ValidationRangeFields } from './ValidationRangeFields';

export const VideoResponseFields: React.FC = () => (
  <>
    <QuestionVideoField />
    <ValidationRangeFields
      minLabel="Lowest result"
      maxLabel="Highest result"
      hint="The bounds of the result the member records after watching, such as seconds held. These limit what they can enter; they are not a scoring range."
    />
  </>
);
