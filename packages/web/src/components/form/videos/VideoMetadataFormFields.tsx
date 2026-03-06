import React from 'react';

import { Button } from '@web/components/button';
import { StaticAlert } from '@web/components/feedback/StaticAlert';
import { useComposableFormContext } from '@web/components/form/composableForm/FormContext';
import { getInputClassName } from '@web/components/form/shared/inputStyles';
import { FormSelect } from '@web/components/form/standardForm/FormSelect';
import type { SelectOption } from '@web/components/form/standardForm/FormSelect';
import { FormTagInput } from '@web/components/form/standardForm/FormTagInput';
import { FormTextarea } from '@web/components/form/standardForm/FormTextarea';
import { Text } from '@web/components/text';

import type { VideoMetadataFormValues } from './types';

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

export interface VideoMetadataFormFieldsProps {
  /** Whether a valid video file has been selected */
  hasFile: boolean;
  /** Called when cancel is clicked */
  onCancel: () => void;
  /** Whether the submit action is in progress (disables + shows loading) */
  isSubmitting?: boolean;
  /** Error message to display above the form */
  errorMessage?: string | null;
}

/** Inner fields component that consumes composable form context */
export const VideoMetadataFormFields: React.FC<VideoMetadataFormFieldsProps> = ({
  hasFile,
  onCancel,
  isSubmitting = false,
  errorMessage,
}) => {
  const { register, control, errors } = useComposableFormContext<VideoMetadataFormValues>();

  const titleError = errors.title?.message;

  return (
    <>
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
    </>
  );
};
