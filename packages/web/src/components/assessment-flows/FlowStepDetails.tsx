import React from 'react';

import type { AdminFlowStepView } from '@ffp/core';

import { Text } from '@web/components/text';

import { FlowStepDetailList } from './FlowStepDetailList';

export interface FlowStepDetailsProps {
  step: AdminFlowStepView;
  /** Name of the linked template, when the step links one */
  templateName?: string;
}

/** Read-only body of an expanded step card. */
export const FlowStepDetails: React.FC<FlowStepDetailsProps> = ({ step, templateName }) => {
  const { description, estimatedMinutes, instructions, safetyNotes } = step.config;
  const hasDetail =
    !!description ||
    estimatedMinutes !== undefined ||
    !!instructions?.length ||
    !!safetyNotes?.length ||
    !!templateName;

  if (!hasDetail) {
    return (
      <Text as="p" styleProps={{ size: 'sm', colour: 'muted-foreground' }}>
        Nothing configured beyond the title yet.
      </Text>
    );
  }

  return (
    <div className="space-y-3">
      {description && (
        <Text as="p" styleProps={{ size: 'sm', colour: 'muted-foreground' }}>
          {description}
        </Text>
      )}

      {templateName && (
        <Text as="p" styleProps={{ size: 'sm' }}>
          <Text styleProps={{ size: 'sm', weight: 'medium' }}>Template: </Text>
          {templateName}
        </Text>
      )}

      {estimatedMinutes !== undefined && (
        <Text as="p" styleProps={{ size: 'sm', colour: 'muted-foreground' }}>
          About {estimatedMinutes} {estimatedMinutes === 1 ? 'minute' : 'minutes'}
        </Text>
      )}

      {!!instructions?.length && <FlowStepDetailList label="Instructions" items={instructions} />}

      {!!safetyNotes?.length && (
        <FlowStepDetailList label="Things to be aware of" items={safetyNotes} />
      )}
    </div>
  );
};
