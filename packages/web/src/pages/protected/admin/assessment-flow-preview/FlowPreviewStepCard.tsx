import React from 'react';

import type { AdminFlowStepView } from '@ffp/core';

import {
  FlowStepDetails,
  FlowStepSummary,
  stepTypeLinksTemplate,
} from '@web/components/assessment-flows';

export interface FlowPreviewStepCardProps {
  step: AdminFlowStepView;
  /** Name of the linked template, when the step links one */
  templateName?: string;
  /** Another step sits at the same position, on a parallel branch */
  sharesPosition: boolean;
}

/**
 * One step as the preview shows it: the builder's summary row with its detail
 * body always open. The frame mirrors `Accordion`'s markup rather than reusing
 * it, because `Accordion` always renders an interactive chevron.
 */
export const FlowPreviewStepCard: React.FC<FlowPreviewStepCardProps> = ({
  step,
  templateName,
  sharesPosition,
}) => {
  const linkedTemplateName = stepTypeLinksTemplate(step.type) ? templateName : undefined;

  return (
    <div className="rounded-md border border-border bg-white">
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
    </div>
  );
};
