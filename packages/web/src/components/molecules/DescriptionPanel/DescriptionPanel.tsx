import React from 'react';

import { Surface, Text } from '@web/components/atoms';

export interface DescriptionPanelProps {
  description: string;
}

/** A record's own explanatory text, boxed above the list it introduces. */
export const DescriptionPanel: React.FC<DescriptionPanelProps> = ({ description }) => (
  <Surface padding="bar" className="mb-4">
    <Text styleProps={{ size: 'sm', colour: 'muted-foreground' }}>{description}</Text>
  </Surface>
);
