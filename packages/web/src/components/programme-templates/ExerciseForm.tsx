import React, { useCallback } from 'react';

import { ComposableForm } from '@web/components/form/composableForm';

import { EMPTY_EXERCISE_VALUES } from './exercise-utils';
import { ExerciseFormFields } from './ExerciseFormFields';

import type { ExerciseFormValues } from './exercise-utils';
import type { SelectedVideo } from './VideoSelector';

export interface ExerciseFormProps {
  /** Initial values for editing — empty for creating */
  initialValues?: ExerciseFormValues;
  /** Selected video info for display (editing existing exercise) */
  initialSelectedVideo?: SelectedVideo | null;
  /** Called with form values on submit */
  onSubmit: (values: ExerciseFormValues) => void;
  /** Called when cancel is clicked */
  onCancel: () => void;
  /** Whether the submit action is in progress */
  isSubmitting?: boolean;
  /** Submit button label @default "Save" */
  submitLabel?: string;
}

/** Inline form for creating or editing an exercise with video selection and prescription fields. */
export const ExerciseForm: React.FC<ExerciseFormProps> = ({
  initialValues = EMPTY_EXERCISE_VALUES,
  initialSelectedVideo = null,
  onSubmit,
  onCancel,
  isSubmitting = false,
  submitLabel = 'Save',
}) => {
  const handleFormSubmit = useCallback(
    (values: ExerciseFormValues) => {
      onSubmit({
        ...values,
        sets: values.sets.trim(),
        reps: values.reps.trim(),
        durationSeconds: values.durationSeconds.trim(),
        restSeconds: values.restSeconds.trim(),
        notes: values.notes.trim(),
      });
    },
    [onSubmit]
  );

  return (
    <ComposableForm<ExerciseFormValues>
      onSubmit={handleFormSubmit}
      defaultValues={initialValues}
      className="space-y-3"
    >
      <ExerciseFormFields
        initialSelectedVideo={initialSelectedVideo}
        onCancel={onCancel}
        isSubmitting={isSubmitting}
        submitLabel={submitLabel}
      />
    </ComposableForm>
  );
};
