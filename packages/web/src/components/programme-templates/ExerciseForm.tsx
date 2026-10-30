import React, { useCallback } from 'react';

import { ComposableForm } from '@web/components/organisms';
import type { SelectedVideo } from '@web/components/video';

import { EMPTY_EXERCISE_VALUES } from './exercise-utils';
import { ExerciseFormFields } from './ExerciseFormFields';

import type { ExerciseFormValues, PrescriptionOnVideoChange } from './exercise-utils';

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
  /** Editing requires sets and reps; creating leaves them to the video's defaults */
  isEditMode?: boolean;
  /** How choosing a video sets the prescription @default 'fill-empty' */
  prescriptionOnVideoChange?: PrescriptionOnVideoChange;
  /** Videos the picker leaves out, by id */
  excludeVideoIds?: readonly string[];
}

/** Inline form for creating or editing an exercise with video selection and prescription fields. */
export const ExerciseForm: React.FC<ExerciseFormProps> = ({
  initialValues = EMPTY_EXERCISE_VALUES,
  initialSelectedVideo = null,
  onSubmit,
  onCancel,
  isSubmitting = false,
  submitLabel = 'Save',
  isEditMode = false,
  prescriptionOnVideoChange = 'fill-empty',
  excludeVideoIds,
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
        isEditMode={isEditMode}
        prescriptionOnVideoChange={prescriptionOnVideoChange}
        excludeVideoIds={excludeVideoIds}
        initialSelectedVideo={initialSelectedVideo}
        onCancel={onCancel}
        isSubmitting={isSubmitting}
        submitLabel={submitLabel}
      />
    </ComposableForm>
  );
};
