import React from 'react';

import type { VideoStatus } from '@ffp/core';

import { Button } from '@web/components/button';
import { StaticAlert } from '@web/components/feedback/StaticAlert';
import { useComposableFormContext } from '@web/components/form/composableForm/FormContext';
import { getInputClassName } from '@web/components/form/shared/inputStyles';
import { FormNumberInput } from '@web/components/form/standardForm/FormNumberInput';
import { FormRow } from '@web/components/form/standardForm/FormRow';
import { FormSelect } from '@web/components/form/standardForm/FormSelect';
import type { SelectOption } from '@web/components/form/standardForm/FormSelect';
import { FormTagInput } from '@web/components/form/standardForm/FormTagInput';
import { FormTextarea } from '@web/components/form/standardForm/FormTextarea';
import { FormTextInput } from '@web/components/form/standardForm/FormTextInput';
import { Text } from '@web/components/text';
import { Title } from '@web/components/text/Title';

import { DIFFICULTY_OPTIONS, MOVEMENT_TYPE_OPTIONS } from './constants';

import type { VideoMetadataFormValues } from './types';

/** Valid status transitions — only show reachable statuses based on current status */
const STATUS_OPTIONS_BY_CURRENT: Record<VideoStatus, SelectOption[]> = {
  draft: [
    { label: 'Draft', value: 'draft' },
    { label: 'Active', value: 'active' },
  ],
  active: [
    { label: 'Active', value: 'active' },
    { label: 'Archived', value: 'archived' },
  ],
  archived: [
    { label: 'Archived', value: 'archived' },
    { label: 'Draft', value: 'draft' },
    { label: 'Active', value: 'active' },
  ],
};

/** Validation for positive integer number fields */
const validatePositiveInteger = (value: string): string | true => {
  if (!value) {
    return true;
  }

  const num = Number(value);

  if (!Number.isInteger(num) || num < 1) {
    return 'Must be a positive whole number';
  }

  return true;
};

export interface VideoMetadataFormFieldsProps {
  /** Form variant — determines which fields are rendered */
  variant: 'upload' | 'edit';
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
  /** Current video status — determines available status transitions (edit variant only) */
  currentStatus?: VideoStatus;
}

/** Shared metadata fields for video upload and edit forms */
export const VideoMetadataFormFields: React.FC<VideoMetadataFormFieldsProps> = ({
  variant,
  onCancel,
  isSubmitting = false,
  errorMessage,
  submitLabel = 'Upload Video',
  submitDisabled = false,
  cancelDisabled = false,
  currentStatus,
}) => {
  const { register, control, errors } = useComposableFormContext<VideoMetadataFormValues>();

  const isEdit = variant === 'edit';
  const titleError = errors.title?.message;
  const statusOptions = currentStatus ? STATUS_OPTIONS_BY_CURRENT[currentStatus] : [];

  return (
    <>
      {errorMessage && <StaticAlert variant="error" message={errorMessage} className="mb-4" />}

      {/* Row 1: Title + Movement Type (2-col) */}
      <FormRow>
        <div className="mb-4">
          <label htmlFor="title" className="mb-1 block">
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
      </FormRow>

      {/* Edit variant: Status field */}
      {isEdit && statusOptions.length > 0 && (
        <FormRow>
          <FormSelect
            name="status"
            label="Status"
            options={statusOptions}
            control={control}
            errors={errors}
          />
        </FormRow>
      )}

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
      <FormRow>
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
      </FormRow>

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

      {/* Edit variant: Default Exercise Prescription section */}
      {isEdit && (
        <div className="mt-6 border-t border-border pt-6">
          <Title as="h3" colour="foreground" className="mb-1">
            Default Exercise Prescription
          </Title>
          <Text as="p" styleProps={{ size: 'sm', colour: 'muted-foreground' }} className="mb-4">
            These values pre-populate when adding this video as an exercise to a session template.
          </Text>

          {/* Sets + Reps (2-col) */}
          <FormRow>
            <FormNumberInput
              name="defaultSets"
              label="Sets"
              placeholder="e.g. 3"
              min={1}
              register={register}
              errors={errors}
              validate={validatePositiveInteger}
            />
            <FormTextInput
              name="defaultReps"
              label="Reps"
              placeholder="e.g. 10 or 8-12"
              register={register}
              errors={errors}
            />
          </FormRow>

          {/* Duration + Rest (2-col) */}
          <FormRow>
            <FormNumberInput
              name="defaultDurationSeconds"
              label="Duration (seconds)"
              placeholder="e.g. 30"
              min={1}
              register={register}
              errors={errors}
              validate={validatePositiveInteger}
            />
            <FormNumberInput
              name="defaultRestSeconds"
              label="Rest (seconds)"
              placeholder="e.g. 60"
              min={1}
              register={register}
              errors={errors}
              validate={validatePositiveInteger}
            />
          </FormRow>

          {/* Notes (full-width) */}
          <FormTextarea
            name="defaultNotes"
            label="Notes"
            placeholder="e.g. Keep core engaged throughout"
            register={register}
            errors={errors}
            rows={2}
          />
        </div>
      )}

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
