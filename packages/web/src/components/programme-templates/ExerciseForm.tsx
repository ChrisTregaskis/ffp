import React, { useCallback, useState } from 'react';

import type { VideoDetailResponse } from '@ffp/core';

import { ComposableForm } from '@web/components/form/composableForm';
import { useComposableFormContext } from '@web/components/form/composableForm/FormContext';
import { FormActions } from '@web/components/form/standardForm/FormActions';
import { FormNumberInput } from '@web/components/form/standardForm/FormNumberInput';
import { FormRow } from '@web/components/form/standardForm/FormRow';
import { FormTextarea } from '@web/components/form/standardForm/FormTextarea';
import { FormTextInput } from '@web/components/form/standardForm/FormTextInput';
import { Text } from '@web/components/text';

import { EMPTY_EXERCISE_VALUES } from './exercise-utils';
import { VideoSelector } from './VideoSelector';

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

/** Fields for the exercise inline form */
const ExerciseFormFields: React.FC<{
  initialSelectedVideo: SelectedVideo | null;
  onCancel: () => void;
  isSubmitting: boolean;
  submitLabel: string;
}> = ({ initialSelectedVideo, onCancel, isSubmitting, submitLabel }) => {
  const { register, errors, setValue, getValues, watch } =
    useComposableFormContext<ExerciseFormValues>();
  const [selectedVideo, setSelectedVideo] = useState<SelectedVideo | null>(initialSelectedVideo);

  const videoId = watch('videoId');

  const handleVideoSelect = useCallback(
    (video: VideoDetailResponse) => {
      setSelectedVideo({ id: video.id, title: video.title });
      setValue('videoId', video.id);

      // Pre-populate prescription from video defaults (only if fields are empty)
      const current = getValues();

      if (!current.sets && video.defaultSets != null) {
        setValue('sets', String(video.defaultSets));
      }

      if (!current.reps && video.defaultReps) {
        setValue('reps', video.defaultReps);
      }

      if (!current.durationSeconds && video.defaultDurationSeconds != null) {
        setValue('durationSeconds', String(video.defaultDurationSeconds));
      }

      if (!current.restSeconds && video.defaultRestSeconds != null) {
        setValue('restSeconds', String(video.defaultRestSeconds));
      }

      if (!current.notes && video.defaultNotes) {
        setValue('notes', video.defaultNotes);
      }
    },
    [setValue, getValues]
  );

  const handleVideoClear = useCallback(() => {
    setSelectedVideo(null);
    setValue('videoId', '');
  }, [setValue]);

  return (
    <>
      <VideoSelector
        onSelect={handleVideoSelect}
        onClear={handleVideoClear}
        selectedVideo={selectedVideo}
        disabled={isSubmitting}
      />

      {videoId && (
        <>
          <FormRow>
            <FormNumberInput<ExerciseFormValues>
              name="sets"
              label="Sets"
              placeholder="e.g. 3"
              min={1}
              register={register}
              errors={errors}
            />
            <FormTextInput<ExerciseFormValues>
              name="reps"
              label="Reps"
              placeholder="e.g. 8-12"
              register={register}
              errors={errors}
            />
          </FormRow>

          <FormRow>
            <FormNumberInput<ExerciseFormValues>
              name="durationSeconds"
              label="Duration (seconds)"
              placeholder="Optional"
              min={1}
              register={register}
              errors={errors}
            />
            <FormNumberInput<ExerciseFormValues>
              name="restSeconds"
              label="Rest (seconds)"
              placeholder="Optional"
              min={0}
              register={register}
              errors={errors}
            />
          </FormRow>

          <FormTextarea<ExerciseFormValues>
            name="notes"
            label="Notes"
            placeholder="Optional exercise instructions..."
            register={register}
            errors={errors}
            rows={2}
          />
        </>
      )}

      <FormActions
        onCancel={onCancel}
        isSubmitting={isSubmitting}
        submitLabel={submitLabel}
        submitDisabled={!videoId}
        compact
      />

      {!videoId && (
        <Text as="p" styleProps={{ size: 'xs', colour: 'muted-foreground' }}>
          Select a video to configure prescription fields.
        </Text>
      )}
    </>
  );
};

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
