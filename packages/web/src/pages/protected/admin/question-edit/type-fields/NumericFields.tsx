import React from 'react';

import { ValidationRangeFields } from './ValidationRangeFields';

export const NumericFields: React.FC = () => (
  <ValidationRangeFields
    minLabel="Lowest accepted value"
    maxLabel="Highest accepted value"
    hint="Leave either blank to accept any number on that side."
  />
);
