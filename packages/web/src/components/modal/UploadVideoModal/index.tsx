import React, { useCallback, useRef, useState } from 'react';

import { Button } from '@web/components/button';
import { StaticAlert } from '@web/components/feedback/StaticAlert';
import { Icon } from '@web/components/Icon';
import { Text } from '@web/components/text';
import { useVideoUpload } from '@web/hooks/videos';

import { Modal } from '../Modal';

import { UploadVideoFooter } from './UploadVideoFooter';

/** Maximum file size in bytes (500 MB) */
const MAX_FILE_SIZE_BYTES = 500 * 1024 * 1024;

/** Accepted MIME type */
const ACCEPTED_MIME_TYPE = 'video/mp4';

/** Format bytes to a human-readable string */
const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${String(bytes)} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
};

/** Validate a selected file and return an error message or null */
const validateFile = (file: File): string | null => {
  if (file.type !== ACCEPTED_MIME_TYPE) {
    return `Invalid file type: ${file.type || 'unknown'}. Only MP4 files are accepted.`;
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    return `File is too large (${formatFileSize(file.size)}). Maximum size is 500 MB.`;
  }

  return null;
};

export interface UploadVideoModalProps {
  /** Whether the modal is visible */
  isOpen: boolean;
  /** Callback to close the modal */
  onClose: () => void;
}

/**
 * Upload video modal
 *
 * Contains drag-and-drop file selection, client-side validation (MP4 only,
 * max 500 MB), and browser-to-S3 upload with progress tracking.
 */
export const UploadVideoModal: React.FC<UploadVideoModalProps> = ({ isOpen, onClose }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { state: uploadState, startUpload, reset: resetUpload } = useVideoUpload();

  const isUploading = uploadState.step === 'requesting-url' || uploadState.step === 'uploading';
  const isComplete = uploadState.step === 'complete';
  const hasUploadError = uploadState.step === 'error';

  const resetAll = useCallback(() => {
    setSelectedFile(null);
    setValidationError(null);
    setIsDragOver(false);
    resetUpload();
  }, [resetUpload]);

  const handleClose = useCallback(() => {
    if (isUploading) {
      return;
    }

    resetAll();
    onClose();
  }, [isUploading, resetAll, onClose]);

  const handleFileSelected = useCallback((file: File) => {
    const error = validateFile(file);

    setValidationError(error);
    setSelectedFile(file);
  }, []);

  const handleInputChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];

      if (file) {
        handleFileSelected(file);
      }

      event.target.value = '';
    },
    [handleFileSelected]
  );

  const handleClickSelect = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();

    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();

    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      event.stopPropagation();

      setIsDragOver(false);

      if (event.dataTransfer.files.length > 0) {
        handleFileSelected(event.dataTransfer.files[0]);
      }
    },
    [handleFileSelected]
  );

  const handleUpload = useCallback(() => {
    if (!selectedFile || validationError) {
      return;
    }

    startUpload(selectedFile);
  }, [selectedFile, validationError, startUpload]);

  const canUpload =
    selectedFile !== null && validationError === null && !isUploading && !isComplete;

  const footer = !isComplete ? (
    <UploadVideoFooter
      canUpload={canUpload}
      isUploading={isUploading}
      onUpload={handleUpload}
      onCancel={handleClose}
    />
  ) : undefined;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Upload New Video"
      subtitle="Upload a new exercise video with description, tags, and metadata."
      size="lg"
      closeOnBackdropClick={!isUploading}
      closeOnEscape={!isUploading}
      footer={footer}
    >
      {/* Upload complete state */}
      {isComplete && (
        <div className="flex flex-col items-center py-6">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-success/20">
            <Icon name="CheckCircle" styleProps={{ size: 'xl', colour: 'var(--color-success)' }} />
          </div>
          <Text styleProps={{ weight: 'semibold', size: 'lg' }} className="mb-2">
            Upload Complete
          </Text>
          <Text as="p" styleProps={{ colour: 'muted-foreground' }} className="mb-6 text-center">
            Video uploaded successfully. Metadata form coming soon.
          </Text>
          <div className="flex gap-3">
            <Button variant="secondary" onClick={handleClose}>
              Close
            </Button>
            <Button variant="primary" onClick={resetAll}>
              Upload Another
            </Button>
          </div>
        </div>
      )}

      {/* Upload in progress */}
      {isUploading && (
        <div className="py-4">
          <div className="mb-4 flex items-center justify-between">
            <Text styleProps={{ weight: 'medium' }}>
              {uploadState.step === 'requesting-url' ? 'Preparing upload...' : 'Uploading...'}
            </Text>
            <Text styleProps={{ colour: 'muted-foreground', size: 'sm' }}>
              {String(uploadState.progress)}%
            </Text>
          </div>
          <div className="h-3 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all duration-300 ease-out"
              style={{ width: `${String(uploadState.progress)}%` }}
              role="progressbar"
              aria-valuenow={uploadState.progress}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Upload progress"
            />
          </div>
          {selectedFile && (
            <Text as="p" styleProps={{ colour: 'muted-foreground', size: 'sm' }} className="mt-3">
              {selectedFile.name} ({formatFileSize(selectedFile.size)})
            </Text>
          )}
        </div>
      )}

      {/* File selection state (idle / error) */}
      {!isUploading && !isComplete && (
        <>
          <div
            onDragOver={handleDragOver}
            onDragEnter={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={handleClickSelect}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleClickSelect();
              }
            }}
            role="button"
            tabIndex={0}
            aria-label="Select video file to upload"
            className={`flex cursor-pointer flex-col items-center rounded-lg border-2 border-dashed p-10 transition-colors ${
              isDragOver
                ? 'border-primary bg-primary/5'
                : 'border-border hover:border-primary/50 hover:bg-muted/30'
            }`}
          >
            <div className="mb-3">
              <Icon
                name="Upload"
                styleProps={{
                  size: 'xl',
                  colour: isDragOver ? 'var(--color-primary)' : 'var(--color-muted-foreground)',
                }}
              />
            </div>
            <Text styleProps={{ weight: 'medium', size: 'lg' }} className="mb-1">
              {isDragOver ? 'Drop your video here' : 'Drag and drop your video here'}
            </Text>
            <Text styleProps={{ colour: 'muted-foreground', size: 'sm' }}>
              or click to browse files
            </Text>
            <Text styleProps={{ colour: 'muted-foreground', size: 'xs' }} className="mt-2">
              MP4 format, up to 500 MB
            </Text>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="video/mp4"
            onChange={handleInputChange}
            className="hidden"
            aria-hidden="true"
          />

          {validationError && (
            <StaticAlert
              variant="error"
              message={validationError}
              onDismiss={() => {
                setValidationError(null);
                setSelectedFile(null);
              }}
              className="mt-4"
            />
          )}

          {hasUploadError && uploadState.errorMessage && (
            <StaticAlert
              variant="error"
              message={uploadState.errorMessage}
              onDismiss={resetAll}
              className="mt-4"
            />
          )}

          {selectedFile && !validationError && (
            <div className="mt-4 flex items-center justify-between rounded-lg border border-border bg-muted/30 p-4">
              <div className="flex items-center gap-3">
                <Icon name="Video" styleProps={{ size: 'md', colour: 'var(--color-primary)' }} />
                <div>
                  <Text styleProps={{ weight: 'medium' }}>{selectedFile.name}</Text>
                  <Text as="p" styleProps={{ colour: 'muted-foreground', size: 'sm' }}>
                    {formatFileSize(selectedFile.size)} &middot; {selectedFile.type}
                  </Text>
                </div>
              </div>
              <Button variant="neutral" size="sm" onClick={resetAll}>
                Remove
              </Button>
            </div>
          )}
        </>
      )}
    </Modal>
  );
};
