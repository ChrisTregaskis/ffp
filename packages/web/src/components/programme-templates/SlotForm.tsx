import React, { useCallback } from 'react';

import { ComposableForm } from '@web/components/organisms';

import { EMPTY_SLOT_VALUES } from './slot-form-values';
import { SlotFormFields } from './SlotFormFields';

import type { SlotFormValues } from './slot-form-values';

export interface SlotFormProps {
  /** Initial values for editing, empty for creating */
  initialValues?: SlotFormValues;
  /** Called with form values on submit */
  onSubmit: (values: SlotFormValues) => void;
  /** Called when cancel is clicked */
  onCancel: () => void;
  /** Whether the submit action is in progress */
  isSubmitting?: boolean;
  /** Submit button label @default "Save" */
  submitLabel?: string;
}

/** Inline form for creating or editing a session slot */
export const SlotForm: React.FC<SlotFormProps> = ({
  initialValues = EMPTY_SLOT_VALUES,
  onSubmit,
  onCancel,
  isSubmitting = false,
  submitLabel = 'Save',
}) => {
  const handleFormSubmit = useCallback(
    (values: SlotFormValues) => {
      onSubmit({ ...values, label: values.label.trim() });
    },
    [onSubmit]
  );

  return (
    <ComposableForm<SlotFormValues>
      onSubmit={handleFormSubmit}
      defaultValues={initialValues}
      className="space-y-3"
    >
      <SlotFormFields
        // The slot's own tags stay offered even once deactivated, so they can be kept
        carriedTagIds={initialValues.tags}
        onCancel={onCancel}
        isSubmitting={isSubmitting}
        submitLabel={submitLabel}
      />
    </ComposableForm>
  );
};
