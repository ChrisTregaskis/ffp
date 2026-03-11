import React from 'react';

import type { VideoStatus } from '@ffp/core';

import { useComposableFormContext } from '@web/components/form/composableForm/FormContext';
import { FormSelect } from '@web/components/form/standardForm/FormSelect';
import type { SelectOption } from '@web/components/form/standardForm/FormSelect';
import { VideoMetadataFormFields } from '@web/components/form/videos';

import type { VideoEditFormValues } from './types';

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

export interface VideoEditFormFieldsProps {
  /** Current video status — determines which status transitions are available */
  currentStatus: VideoStatus;
  /** Called when cancel is clicked */
  onCancel: () => void;
  /** Whether the submit action is in progress */
  isSubmitting?: boolean;
  /** Error message to display above the form */
  errorMessage?: string | null;
}

/** Form fields for editing video metadata, including status transitions */
export const VideoEditFormFields: React.FC<VideoEditFormFieldsProps> = ({
  currentStatus,
  onCancel,
  isSubmitting = false,
  errorMessage,
}) => {
  const { control, errors } = useComposableFormContext<VideoEditFormValues>();
  const statusOptions = STATUS_OPTIONS_BY_CURRENT[currentStatus];

  return (
    <VideoMetadataFormFields
      onCancel={onCancel}
      isSubmitting={isSubmitting}
      errorMessage={errorMessage}
      submitLabel="Save Changes"
      cancelDisabled={isSubmitting}
      additionalFields={
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormSelect
            name="status"
            label="Status"
            options={statusOptions}
            control={control}
            errors={errors}
          />
        </div>
      }
    />
  );
};
