import React, { useCallback, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';

import { Button } from '@web/components/button';
import { StaticAlert } from '@web/components/feedback/StaticAlert';
import { FormSelect } from '@web/components/form/standardForm/FormSelect';
import type { SelectOption } from '@web/components/form/standardForm/FormSelect';
import { FormTagInput } from '@web/components/form/standardForm/FormTagInput';
import { FormTextarea } from '@web/components/form/standardForm/FormTextarea';
import { Text } from '@web/components/text';
import type { VideoMetadataValues } from '@web/hooks/videos/useUploadVideoModal';

/** Internal form values — durationSeconds is a string from the input */
interface VideoMetadataFormValues {
  title: string;
  description: string;
  movementType: string;
  difficulty: string;
  bodyParts: string[];
  equipment: string[];
  tags: string[];
  durationSeconds: string;
}

const MOVEMENT_TYPE_OPTIONS: SelectOption[] = [
  { label: 'Stretch', value: 'stretch' },
  { label: 'Strength', value: 'strength' },
  { label: 'Mobility', value: 'mobility' },
  { label: 'Balance', value: 'balance' },
];

const DIFFICULTY_OPTIONS: SelectOption[] = [
  { label: 'Beginner', value: 'beginner' },
  { label: 'Intermediate', value: 'intermediate' },
  { label: 'Advanced', value: 'advanced' },
];

export interface VideoMetadataFormProps {
  /** Whether a valid video file has been selected */
  hasFile: boolean;
  /** Duration in seconds auto-detected from the video file (null if not yet available) */
  detectedDuration?: number | null;
  /** Called when the form is submitted with valid metadata */
  onSubmit: (data: VideoMetadataValues) => void;
  /** Called when cancel is clicked */
  onCancel: () => void;
  /** Whether the submit action is in progress (disables + shows loading) */
  isSubmitting?: boolean;
  /** Error message to display above the form */
  errorMessage?: string | null;
}

/**
 * Video metadata form for the upload modal.
 *
 * Collects title, description, movement type, difficulty, body parts, equipment,
 * tags, and duration. Returns a VideoMetadataValues object on submit — the parent
 * hook handles assembling the full CreateVideoInput with upload-derived fields.
 */
export const VideoMetadataForm: React.FC<VideoMetadataFormProps> = ({
  hasFile,
  detectedDuration,
  onSubmit,
  onCancel,
  isSubmitting = false,
  errorMessage,
}) => {
  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors },
  } = useForm<VideoMetadataFormValues>({
    defaultValues: {
      title: '',
      description: '',
      movementType: '',
      difficulty: '',
      bodyParts: [],
      equipment: [],
      tags: [],
      durationSeconds: '',
    },
  });

  // Auto-fill duration when detected from file metadata
  useEffect(() => {
    if (detectedDuration !== null && detectedDuration !== undefined) {
      setValue('durationSeconds', String(detectedDuration));
    }
  }, [detectedDuration, setValue]);

  const handleFormSubmit = useCallback(
    (values: VideoMetadataFormValues) => {
      const metadata: VideoMetadataValues = {
        title: values.title,
        durationSeconds: parseInt(values.durationSeconds, 10),
        bodyParts: values.bodyParts,
        equipment: values.equipment,
        description: values.description || undefined,
        movementType: values.movementType || undefined,
        difficulty: values.difficulty || undefined,
        tags: values.tags,
      };

      onSubmit(metadata);
    },
    [onSubmit]
  );

  const onFormSubmit = useMemo(
    () => handleSubmit(handleFormSubmit),
    [handleSubmit, handleFormSubmit]
  );

  const titleError = errors.title?.message;
  const durationError = errors.durationSeconds?.message;

  return (
    <form
      onSubmit={(e) => {
        void onFormSubmit(e);
      }}
    >
      {errorMessage && <StaticAlert variant="error" message={errorMessage} className="mb-4" />}

      {/* Row 1: Title + Movement Type (2-col) */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="mb-4">
          <label htmlFor="title" className="block mb-1">
            <Text styleProps={{ size: 'sm', weight: 'medium', colour: 'muted-foreground' }}>
              Video Title
            </Text>
            <Text styleProps={{ colour: 'destructive' }} className="ml-1">
              *
            </Text>
          </label>
          <input
            id="title"
            type="text"
            placeholder="e.g. Seated Hamstring Stretch"
            aria-required
            aria-invalid={!!titleError}
            aria-describedby={titleError ? 'title-error' : undefined}
            {...register('title', {
              required: 'Video Title is required',
              maxLength: { value: 255, message: 'Maximum length is 255 characters' },
            })}
            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent ${titleError ? 'border-red-500' : 'border-gray-300'}`}
          />
          {titleError && (
            <Text
              as="p"
              id="title-error"
              styleProps={{ size: 'sm', colour: 'destructive' }}
              className="mt-1"
              role="alert"
            >
              {titleError}
            </Text>
          )}
        </div>

        <FormSelect
          name="movementType"
          label="Movement Type"
          options={MOVEMENT_TYPE_OPTIONS}
          placeholder="Select type..."
          register={register}
          errors={errors}
        />
      </div>

      {/* Row 2: Description (full-width) */}
      <FormTextarea
        name="description"
        label="Description"
        placeholder="Detailed exercise instructions..."
        register={register}
        errors={errors}
        rows={3}
      />

      {/* Row 3: Difficulty + Body Parts + Equipment (3-col) */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <FormSelect
          name="difficulty"
          label="Difficulty"
          options={DIFFICULTY_OPTIONS}
          placeholder="Select level..."
          register={register}
          errors={errors}
        />
        <FormTagInput
          name="bodyParts"
          label="Body Parts"
          placeholder="e.g. hamstrings"
          control={control}
          errors={errors}
          isRequired
        />
        <FormTagInput
          name="equipment"
          label="Equipment"
          placeholder="e.g. yoga mat"
          control={control}
          errors={errors}
        />
      </div>

      {/* Row 4: Tags (full-width) */}
      <FormTagInput
        name="tags"
        label="Tags"
        placeholder="e.g. warm-up, post-surgery"
        control={control}
        errors={errors}
      />

      {/* Row 5: Duration (half-width) */}
      <div className="grid grid-cols-1 sm:grid-cols-2">
        <div className="mb-4">
          <label htmlFor="durationSeconds" className="block mb-1">
            <Text styleProps={{ size: 'sm', weight: 'medium', colour: 'muted-foreground' }}>
              Duration (seconds)
            </Text>
            <Text styleProps={{ colour: 'destructive' }} className="ml-1">
              *
            </Text>
          </label>
          <input
            id="durationSeconds"
            type="number"
            min={0}
            step={1}
            placeholder="e.g. 120"
            aria-required
            aria-invalid={!!durationError}
            aria-describedby={durationError ? 'durationSeconds-error' : undefined}
            {...register('durationSeconds', {
              required: 'Duration is required',
              validate: (value) => {
                const num = parseInt(value, 10);

                if (isNaN(num)) return 'Duration must be a number';
                if (num < 0) return 'Duration must be non-negative';
                if (!Number.isInteger(num)) return 'Duration must be a whole number';

                return true;
              },
            })}
            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent ${durationError ? 'border-red-500' : 'border-gray-300'}`}
          />
          {durationError && (
            <Text
              as="p"
              id="durationSeconds-error"
              styleProps={{ size: 'sm', colour: 'destructive' }}
              className="mt-1"
              role="alert"
            >
              {durationError}
            </Text>
          )}
        </div>
      </div>

      {/* Form actions */}
      <div className="mt-6 flex items-center justify-end gap-3 border-t border-border pt-4">
        <Button variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={!hasFile} loading={isSubmitting}>
          Upload Video
        </Button>
      </div>
    </form>
  );
};
