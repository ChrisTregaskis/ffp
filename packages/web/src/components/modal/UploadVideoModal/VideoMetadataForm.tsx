import React, { useCallback, useMemo } from 'react';
import { useForm } from 'react-hook-form';

import { Button } from '@web/components/button';
import { StaticAlert } from '@web/components/feedback/StaticAlert';
import { getInputClassName } from '@web/components/form/shared/inputStyles';
import { FormSelect } from '@web/components/form/standardForm/FormSelect';
import type { SelectOption } from '@web/components/form/standardForm/FormSelect';
import { FormTagInput } from '@web/components/form/standardForm/FormTagInput';
import { FormTextarea } from '@web/components/form/standardForm/FormTextarea';
import { Text } from '@web/components/text';
import type { VideoMetadataValues } from '@web/hooks/videos/types';

/** Internal form values */
interface VideoMetadataFormValues {
  title: string;
  description: string;
  movementType: string;
  difficulty: string;
  bodyParts: string[];
  equipment: string[];
  tags: string[];
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
 * and tags. Returns a VideoMetadataValues object on submit — the parent
 * hook handles assembling the full CreateVideoInput with upload-derived fields
 * (duration, file size, S3 key, etc.).
 */
export const VideoMetadataForm: React.FC<VideoMetadataFormProps> = ({
  hasFile,
  onSubmit,
  onCancel,
  isSubmitting = false,
  errorMessage,
}) => {
  const {
    register,
    handleSubmit,
    control,
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
    },
  });

  const handleFormSubmit = useCallback(
    (values: VideoMetadataFormValues) => {
      const metadata: VideoMetadataValues = {
        title: values.title,
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
            className={`${getInputClassName(!!titleError)} w-full px-3 py-2`}
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
          control={control}
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
          control={control}
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
