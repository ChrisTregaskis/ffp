import React from 'react';

import { Button } from '@web/components/button';
import { StaticAlert } from '@web/components/feedback/StaticAlert';
import { useComposableFormContext } from '@web/components/form/composableForm/FormContext';
import { getInputClassName } from '@web/components/form/shared/inputStyles';
import { FormSelect } from '@web/components/form/standardForm/FormSelect';
import { FormTagInput } from '@web/components/form/standardForm/FormTagInput';
import { FormTextarea } from '@web/components/form/standardForm/FormTextarea';
import { Text } from '@web/components/text';

import { DIFFICULTY_OPTIONS, MOVEMENT_TYPE_OPTIONS } from './constants';

import type { VideoMetadataFormValues } from './types';
import type { ReactNode } from 'react';

export interface VideoMetadataFormFieldsProps {
  /** Called when cancel is clicked */
  onCancel: () => void;
  /** Whether the submit action is in progress (disables + shows loading) */
  isSubmitting?: boolean;
  /** Error message to display above the form */
  errorMessage?: string | null;
  /** Submit button label @default "Upload Video" */
  submitLabel?: string;
  /** Whether the submit button is disabled @default false */
  submitDisabled?: boolean;
  /** Whether the cancel button is disabled @default false */
  cancelDisabled?: boolean;
  /** Additional fields rendered after the title row (e.g. Status for edit mode) */
  additionalFields?: ReactNode;
}

/** Shared metadata fields for video upload and edit forms */
export const VideoMetadataFormFields: React.FC<VideoMetadataFormFieldsProps> = ({
  onCancel,
  isSubmitting = false,
  errorMessage,
  submitLabel = 'Upload Video',
  submitDisabled = false,
  cancelDisabled = false,
  additionalFields,
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

      {/* Additional fields slot */}
      {additionalFields}

      {/* Row 2: Description (full-width) */}
      <FormTextarea
        name="description"
        label="Description"
        placeholder="Detailed exercise instructions..."
        register={register}
        errors={errors}
        rows={3}
      />

      {/* Row 3: Difficulty + Equipment (2-col) */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormSelect
          name="difficulty"
          label="Difficulty"
          options={DIFFICULTY_OPTIONS}
          placeholder="Select level..."
          control={control}
          errors={errors}
        />
        <FormTagInput
          name="equipment"
          label="Equipment"
          placeholder="e.g. yoga mat"
          control={control}
          errors={errors}
        />
      </div>

      {/* Row 4: Body Parts (full-width) */}
      <FormTagInput
        name="bodyParts"
        label="Body Parts"
        placeholder="e.g. hamstrings"
        control={control}
        errors={errors}
        isRequired
      />

      {/* Row 5: Tags (full-width) */}
      <FormTagInput
        name="tags"
        label="Tags"
        placeholder="e.g. warm-up, post-surgery"
        control={control}
        errors={errors}
      />

      {/* Form actions */}
      <div className="mt-6 flex items-center justify-end gap-3 border-t border-border pt-4">
        <Button variant="secondary" onClick={onCancel} disabled={cancelDisabled}>
          Cancel
        </Button>
        <Button type="submit" disabled={submitDisabled} loading={isSubmitting}>
          {submitLabel}
        </Button>
      </div>
    </>
  );
};
