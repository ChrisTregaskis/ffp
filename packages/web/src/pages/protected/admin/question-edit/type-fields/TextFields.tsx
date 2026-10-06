import React from 'react';

import { ValidationRangeFields } from './ValidationRangeFields';

export const TextFields: React.FC = () => (
  <ValidationRangeFields
    minLabel="Shortest answer"
    maxLabel="Longest answer"
    hint="Answer length in characters. Leave either blank for no limit."
  />
);
