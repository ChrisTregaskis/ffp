import React from 'react';

import { Text } from '@web/components/text';

export interface FlowDescriptionPanelProps {
  description: string;
}

/** The flow's own explanatory text, shown above its steps. */
export const FlowDescriptionPanel: React.FC<FlowDescriptionPanelProps> = ({ description }) => (
  <div className="mb-4 rounded-lg border border-border bg-white px-5 py-4">
    <Text styleProps={{ size: 'sm', colour: 'muted-foreground' }}>{description}</Text>
  </div>
);
