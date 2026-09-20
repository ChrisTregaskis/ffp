import React from 'react';

import { ComposableForm } from '@web/components/form/composableForm';

import { EMPTY_FLOW_STEP_VALUES } from './flow-step-form-values';
import { FlowStepFormFields } from './FlowStepFormFields';

import type { FlowStepFormValues } from './flow-step-form-values';

export interface FlowStepFormProps {
  /** Values to edit; omitted when adding a step */
  initialValues?: FlowStepFormValues;
  onSubmit: (values: FlowStepFormValues) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
  /** Submit button label @default "Save step" */
  submitLabel?: string;
}

/** Inline add/edit form for a step. */
export const FlowStepForm: React.FC<FlowStepFormProps> = ({
  initialValues = EMPTY_FLOW_STEP_VALUES,
  onSubmit,
  onCancel,
  isSubmitting = false,
  submitLabel = 'Save step',
}) => (
  <ComposableForm<FlowStepFormValues> onSubmit={onSubmit} defaultValues={initialValues}>
    <FlowStepFormFields onCancel={onCancel} isSubmitting={isSubmitting} submitLabel={submitLabel} />
  </ComposableForm>
);
