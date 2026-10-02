import React from 'react';

import { Text } from '@web/components/text';

export interface FlowStepDetailListProps {
  label: string;
  items: string[];
}

/** A labelled bullet list of author-entered lines. */
export const FlowStepDetailList: React.FC<FlowStepDetailListProps> = ({ label, items }) => (
  <div>
    <Text styleProps={{ size: 'sm', weight: 'medium' }}>{label}</Text>
    <ul className="mt-1 list-disc space-y-0.5 pl-5">
      {items.map((item, index) => (
        // Keyed by position: the list is read-only and never reordered, and two
        // identical lines are possible in free text
        <li key={index}>
          <Text styleProps={{ size: 'sm', colour: 'muted-foreground' }}>{item}</Text>
        </li>
      ))}
    </ul>
  </div>
);
