import React from 'react';

import type { VideoStatus } from '@ffp/core';

import { VideoMetadataFormFields } from '@web/components/form/videos';

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

/** Form fields for editing video metadata — thin wrapper passing edit variant */
export const VideoEditFormFields: React.FC<VideoEditFormFieldsProps> = ({
  currentStatus,
  onCancel,
  isSubmitting = false,
  errorMessage,
}) => (
  <VideoMetadataFormFields
    variant="edit"
    currentStatus={currentStatus}
    onCancel={onCancel}
    isSubmitting={isSubmitting}
    errorMessage={errorMessage}
    submitLabel="Save Changes"
    cancelDisabled={isSubmitting}
  />
);
