import React from 'react';

import type { AdminFlowStepView } from '@ffp/core';

import { Text } from '@web/components/text';

import { BranchingRuleBadge } from './BranchingRuleBadge';
import { STEP_TYPE_LABELS } from './flow-step-labels';

export interface FlowStepSummaryProps {
  step: AdminFlowStepView;
  /** Name of the linked template, when the step links one */
  templateName?: string;
  /** Another step sits at the same position, on a parallel branch */
  sharesPosition: boolean;
}

/**
 * A step's headline row, shared by the builder's card trigger and the read-only
 * preview so a step reads identically in both.
 */
export const FlowStepSummary: React.FC<FlowStepSummaryProps> = ({
  step,
  templateName,
  sharesPosition,
}) => (
  <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
    <Text styleProps={{ size: 'sm', colour: 'muted-foreground' }}>{step.order}</Text>
    <Text styleProps={{ size: 'sm', weight: 'medium' }} className="truncate">
      {step.config.title}
    </Text>
    <span className="rounded bg-muted px-2 py-0.5">
      <Text styleProps={{ size: 'xs', colour: 'muted-foreground' }}>
        {STEP_TYPE_LABELS[step.type]}
      </Text>
    </span>
    {templateName && (
      <Text styleProps={{ size: 'xs', colour: 'muted-foreground' }} className="truncate">
        {templateName}
      </Text>
    )}
    <BranchingRuleBadge ruleCount={step.branchingRuleCount} />
    {sharesPosition && (
      <span className="rounded-full bg-info/10 px-2.5 py-0.5">
        <Text styleProps={{ size: 'xs', weight: 'medium', colour: 'info' }}>
          Shares position {step.order}
        </Text>
      </span>
    )}
  </div>
);
