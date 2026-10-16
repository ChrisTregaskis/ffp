import React from 'react';

import type { AdminFlowStepView } from '@ffp/core';

import { Surface } from '@web/components/atoms';

import { stepTypeLinksTemplate } from './flow-step-labels';
import { FlowStepDetails } from './FlowStepDetails';
import { FlowStepSummary } from './FlowStepSummary';

export interface FlowPreviewStepCardProps {
  step: AdminFlowStepView;
  /** Name of the linked template, when the step links one */
  templateName?: string;
  /** Another step sits at the same position, on a parallel branch */
  sharesPosition: boolean;
}

/**
 * One step as the preview shows it: the builder's summary row with its detail
 * body always open. It shares `Accordion`'s frame rather than reusing `Accordion`,
 * because `Accordion` always renders an interactive chevron.
 */
export const FlowPreviewStepCard: React.FC<FlowPreviewStepCardProps> = ({
  step,
  templateName,
  sharesPosition,
}) => {
  const linkedTemplateName = stepTypeLinksTemplate(step.type) ? templateName : undefined;

  return (
    <Surface radius="md">
      <div className="flex items-center justify-between px-3 py-2">
        <FlowStepSummary
          step={step}
          templateName={linkedTemplateName}
          sharesPosition={sharesPosition}
        />
      </div>
      <div className="border-t border-border px-3 py-3">
        <FlowStepDetails step={step} templateName={linkedTemplateName} />
      </div>
    </Surface>
  );
};
