import React, { useCallback, useState } from 'react';

import type { VideoDetailResponse } from '@ffp/core';

import { Text, FormRow } from '@web/components/atoms';
import { FormActions, FormTextarea, FormTextInput } from '@web/components/molecules';
import { useComposableFormContext } from '@web/components/organisms';
import { VideoSelector } from '@web/components/video';
import type { SelectedVideo } from '@web/components/video';

import { PRESCRIPTION_FIELDS, prescriptionFromVideo } from './exercise-utils';

import type { ExerciseFormValues, PrescriptionOnVideoChange } from './exercise-utils';

// The form trims on submit, so a value of only spaces would read as blank. Sets and reps
// cannot be stored empty, so editing refuses a blank rather than keeping the old value unseen.
const requiredOnEdit = (message: string): { validate: (value: string) => true | string } => ({
  validate: (value) => value.trim() !== '' || message,
});

/** Fields for the exercise inline form */
export const ExerciseFormFields: React.FC<{
  isEditMode: boolean;
  prescriptionOnVideoChange: PrescriptionOnVideoChange;
  excludeVideoIds?: readonly string[];
  initialSelectedVideo: SelectedVideo | null;
  onCancel: () => void;
  isSubmitting: boolean;
  submitLabel: string;
}> = ({
  isEditMode,
  prescriptionOnVideoChange,
  excludeVideoIds,
  initialSelectedVideo,
  onCancel,
  isSubmitting,
  submitLabel,
}) => {
  const { register, errors, setValue, getValues, watch } =
    useComposableFormContext<ExerciseFormValues>();
  const [selectedVideo, setSelectedVideo] = useState<SelectedVideo | null>(initialSelectedVideo);

  const videoId = watch('videoId');

  const handleVideoSelect = useCallback(
    (video: VideoDetailResponse) => {
      setSelectedVideo({ publicId: video.publicId, title: video.title });
      setValue('videoId', video.id);

      const prescription = prescriptionFromVideo(video, getValues(), prescriptionOnVideoChange);

      for (const field of PRESCRIPTION_FIELDS) {
        setValue(field, prescription[field]);
      }
    },
    [setValue, getValues, prescriptionOnVideoChange]
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
        excludeVideoIds={excludeVideoIds}
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
