import React from 'react';

import { ValidationRangeFields } from './ValidationRangeFields';

export const ScaleFields: React.FC = () => (
  <ValidationRangeFields
    minLabel="Scale starts at"
    maxLabel="Scale ends at"
    hint="The member picks a point on this scale. Left blank, it runs from 1 to 10."
    minPlaceholder="1"
    maxPlaceholder="10"
  />
);
