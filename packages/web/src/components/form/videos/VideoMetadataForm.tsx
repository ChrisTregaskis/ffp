import React, { useCallback } from 'react';

import { ComposableForm } from '@web/components/form/composableForm';
import type { VideoMetadataValues } from '@web/hooks/videos/types';

import { VideoMetadataFormFields } from './VideoMetadataFormFields';

import type { VideoMetadataFormValues } from './types';

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
  /** Additional class names for the form wrapper */
  className?: string;
}

/**
 * Video metadata form for the upload page.
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
  className,
}) => {
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

  return (
    <ComposableForm<VideoMetadataFormValues>
      className={className}
      onSubmit={handleFormSubmit}
      defaultValues={{
        title: '',
        description: '',
        movementType: '',
        difficulty: '',
        bodyParts: [],
        equipment: [],
        tags: [],
      }}
    >
      <VideoMetadataFormFields
        onCancel={onCancel}
        isSubmitting={isSubmitting}
        errorMessage={errorMessage}
        submitDisabled={!hasFile}
      />
    </ComposableForm>
  );
};
