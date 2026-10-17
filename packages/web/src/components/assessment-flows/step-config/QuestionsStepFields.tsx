import React from 'react';

import { AssessmentTemplateField } from '../AssessmentTemplateField';
import { StepEstimatedMinutesField } from '../StepEstimatedMinutesField';

/** A questions step draws its content from a template, so the link is required. */
export const QuestionsStepFields: React.FC = () => (
  <>
    <AssessmentTemplateField />
    <StepEstimatedMinutesField />
  </>
);
