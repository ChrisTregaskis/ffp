import React, { useCallback, useState } from 'react';

import type { VideoDetailResponse } from '@ffp/core';

import { Text, FormRow } from '@web/components/atoms';
import { FormActions, FormTextarea, FormTextInput } from '@web/components/molecules';
import { useComposableFormContext } from '@web/components/organisms';

import { VideoSelector } from './VideoSelector';

import type { ExerciseFormValues } from './exercise-utils';
import type { SelectedVideo } from './VideoSelector';

// The form trims on submit, so a value of only spaces would read as blank. Sets and reps
// cannot be stored empty, so editing refuses a blank rather than keeping the old value unseen.
const requiredOnEdit = (message: string): { validate: (value: string) => true | string } => ({
  validate: (value) => value.trim() !== '' || message,
});

/** Fields for the exercise inline form */
export const ExerciseFormFields: React.FC<{
  isEditMode: boolean;
  initialSelectedVideo: SelectedVideo | null;
  onCancel: () => void;
  isSubmitting: boolean;
  submitLabel: string;
}> = ({ isEditMode, initialSelectedVideo, onCancel, isSubmitting, submitLabel }) => {
  const { register, errors, setValue, getValues, watch } =
    useComposableFormContext<ExerciseFormValues>();
  const [selectedVideo, setSelectedVideo] = useState<SelectedVideo | null>(initialSelectedVideo);

  const videoId = watch('videoId');

  const handleVideoSelect = useCallback(
    (video: VideoDetailResponse) => {
      setSelectedVideo({ publicId: video.publicId, title: video.title });
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
            <FormTextInput<ExerciseFormValues>
              name="sets"
              type="number"
              label="Sets"
              placeholder="e.g. 3"
              register={register}
              errors={errors}
              inputProps={{ min: 1 }}
              isRequired={isEditMode}
              registerOptions={isEditMode ? requiredOnEdit('Please give the sets') : undefined}
            />
            <FormTextInput<ExerciseFormValues>
              name="reps"
              label="Reps"
              placeholder="e.g. 8-12"
              register={register}
              errors={errors}
              isRequired={isEditMode}
              registerOptions={isEditMode ? requiredOnEdit('Please give the reps') : undefined}
            />
          </FormRow>

          <FormRow>
            <FormTextInput<ExerciseFormValues>
              name="durationSeconds"
              type="number"
              label="Duration (seconds)"
              placeholder="Optional"
              register={register}
              errors={errors}
              inputProps={{ min: 1 }}
            />
            <FormTextInput<ExerciseFormValues>
              name="restSeconds"
              type="number"
              label="Rest (seconds)"
              placeholder="Optional"
              register={register}
              errors={errors}
              inputProps={{ min: 0 }}
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
