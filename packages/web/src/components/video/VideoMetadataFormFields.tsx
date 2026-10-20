import React from 'react';

import type { VideoStatus } from '@ffp/core';

import { Text, Title, FormRow } from '@web/components/atoms';
import type { SelectOption } from '@web/components/molecules';
import {
  FormActions,
  FormCheckboxGroup,
  FormSelect,
  StaticAlert,
  FormTagInput,
  FormTextarea,
  FormTextInput,
} from '@web/components/molecules';
import { useComposableFormContext } from '@web/components/organisms';
import { DIFFICULTY_OPTIONS } from '@web/constants';
import { useTagCategoriesQuery } from '@web/hooks/tags';

import { toTagOptions } from './tag-options';

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
  /** Tag publicIds the video was loaded with, so an inactive one stays listed (edit variant only) */
  carriedTagIds?: string[];
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
  carriedTagIds = [],
}) => {
  const { register, control, errors } = useComposableFormContext<VideoMetadataFormValues>();
  const { data: tagCategories, isError: tagsFailed } = useTagCategoriesQuery();
  const tagsHint = tagsFailed ? 'Tags could not be loaded. Reload to try again.' : undefined;

  const isEdit = variant === 'edit';
  const statusOptions = currentStatus ? STATUS_OPTIONS_BY_CURRENT[currentStatus] : [];

  return (
    <>
      {errorMessage && <StaticAlert variant="error" message={errorMessage} className="mb-4" />}

      {/* Row 1: Title (full-width) */}
      <FormTextInput
        name="title"
        label="Video Title"
        placeholder="e.g. Seated Hamstring Stretch"
        register={register}
        errors={errors}
        isRequired
        registerOptions={{
          required: 'Video Title is required',
          maxLength: { value: 255, message: 'Maximum length is 255 characters' },
        }}
      />

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

      {/* Row 4: Movement + Body Areas (full-width) */}
      <FormCheckboxGroup
        name="movementTags"
        label="Movement"
        options={toTagOptions(tagCategories, 'movement', carriedTagIds)}
        control={control}
        errors={errors}
        hint={tagsHint}
      />
      <FormCheckboxGroup
        name="bodyAreaTags"
        label="Body Areas"
        options={toTagOptions(tagCategories, 'body-area', carriedTagIds)}
        control={control}
        errors={errors}
        hint={tagsHint}
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
            <FormTextInput
              name="defaultSets"
              type="number"
              label="Sets"
              placeholder="e.g. 3"
              register={register}
              errors={errors}
              inputProps={{ min: 1 }}
              registerOptions={{ validate: validatePositiveInteger }}
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
            <FormTextInput
              name="defaultDurationSeconds"
              type="number"
              label="Duration (seconds)"
              placeholder="e.g. 30"
              register={register}
              errors={errors}
              inputProps={{ min: 1 }}
              registerOptions={{ validate: validatePositiveInteger }}
            />
            <FormTextInput
              name="defaultRestSeconds"
              type="number"
              label="Rest (seconds)"
              placeholder="e.g. 60"
              register={register}
              errors={errors}
              inputProps={{ min: 1 }}
              registerOptions={{ validate: validatePositiveInteger }}
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

      <FormActions
        onCancel={onCancel}
        submitLabel={submitLabel}
        isSubmitting={isSubmitting}
        cancelDisabled={cancelDisabled}
        submitDisabled={submitDisabled}
      />
    </>
  );
};
