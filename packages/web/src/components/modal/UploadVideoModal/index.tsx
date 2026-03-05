import React from 'react';

import { Button } from '@web/components/button';
import { StaticAlert } from '@web/components/feedback/StaticAlert';
import { Icon } from '@web/components/Icon';
import { Text } from '@web/components/text';
import { useUploadVideoModal } from '@web/hooks/videos/useUploadVideoModal';
import { formatFileSize } from '@web/utils/format';

import { Modal } from '../Modal';

import { ThumbnailUpload } from './ThumbnailUpload';
import { VideoMetadataForm } from './VideoMetadataForm';

export interface UploadVideoModalProps {
  /** Whether the modal is visible */
  isOpen: boolean;
  /** Callback to close the modal */
  onClose: () => void;
  /** Called after a video record is successfully created */
  onVideoCreated?: () => void;
}

/**
 * Upload video modal — restructured UX flow
 *
 * Shows drop zone, metadata form, and thumbnail picker all at once.
 * On submit: upload to S3 with progress, then create video record.
 * On success: offer Close or Upload Another.
 */
export const UploadVideoModal: React.FC<UploadVideoModalProps> = ({
  isOpen,
  onClose,
  onVideoCreated,
}) => {
  const {
    state,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleFileInputChange,
    handleClickSelect,
    handleClearFile,
    handleThumbnailSelected,
    handleThumbnailClear,
    handleSubmit,
    handleClose,
    handleReset,
    fileInputRef,
    hasValidFile,
    canClose,
  } = useUploadVideoModal(onClose, onVideoCreated);

  const { phase, selectedFile, fileValidationError, isDragOver } = state;
  const showForm = phase === 'idle' || phase === 'error';

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Upload New Video"
      subtitle="Add a new exercise video with description, tags, and metadata."
      size="lg"
      closeOnBackdropClick={canClose}
      closeOnEscape={canClose}
    >
      {/* ── Success view ── */}
      {phase === 'success' && (
        <div className="flex flex-col items-center py-6">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-success/20">
            <Icon name="CheckCircle" styleProps={{ size: 'xl', colour: 'var(--color-success)' }} />
          </div>
          <Text styleProps={{ weight: 'semibold', size: 'lg' }} className="mb-2">
            Video Created
          </Text>
          <Text as="p" styleProps={{ colour: 'muted-foreground' }} className="mb-6 text-center">
            Your video has been created successfully with status &ldquo;draft&rdquo;.
          </Text>
          <div className="flex gap-3">
            <Button variant="secondary" onClick={handleClose}>
              Close
            </Button>
            <Button variant="primary" onClick={handleReset}>
              Upload Another
            </Button>
          </div>
        </div>
      )}

      {/* ── Progress view (uploading or creating) ── */}
      {(phase === 'uploading' || phase === 'creating') && (
        <div className="py-4">
          {phase === 'uploading' && (
            <>
              <div className="mb-4 flex items-center justify-between">
                <Text styleProps={{ weight: 'medium' }}>
                  {state.uploadProgress === 0 ? 'Preparing upload...' : 'Uploading...'}
                </Text>
                <Text styleProps={{ colour: 'muted-foreground', size: 'sm' }}>
                  {String(state.uploadProgress)}%
                </Text>
              </div>
              <div className="h-3 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-300 ease-out"
                  style={{ width: `${String(state.uploadProgress)}%` }}
                  role="progressbar"
                  aria-valuenow={state.uploadProgress}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label="Upload progress"
                />
              </div>
              {selectedFile && (
                <Text
                  as="p"
                  styleProps={{ colour: 'muted-foreground', size: 'sm' }}
                  className="mt-3"
                >
                  {selectedFile.name} ({formatFileSize(selectedFile.size)})
                </Text>
              )}
            </>
          )}

          {phase === 'creating' && (
            <div className="flex flex-col items-center py-6">
              <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-primary" />
              <Text styleProps={{ weight: 'medium' }}>Creating video record...</Text>
            </div>
          )}
        </div>
      )}

      {/* ── Form view (idle or error) ── */}
      {showForm && (
        <>
          {/* Submit error alert */}
          {state.submitError && (
            <StaticAlert variant="error" message={state.submitError} className="mb-4" />
          )}

          {/* Drop zone — shown when no valid file is selected */}
          {!hasValidFile && (
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
          )}

          {/* File info card — shown when a valid file is selected */}
          {hasValidFile && selectedFile && (
            <div className="flex items-center justify-between rounded-lg border border-border bg-muted/30 p-4">
              <div className="flex items-center gap-3">
                <Icon name="Video" styleProps={{ size: 'md', colour: 'var(--color-primary)' }} />
                <div>
                  <Text styleProps={{ weight: 'medium' }}>{selectedFile.name}</Text>
                  <Text as="p" styleProps={{ colour: 'muted-foreground', size: 'sm' }}>
                    {formatFileSize(selectedFile.size)} &middot; {selectedFile.type}
                  </Text>
                </div>
              </div>
              <Button variant="neutral" size="sm" onClick={handleClearFile}>
                Remove
              </Button>
            </div>
          )}

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="video/mp4"
            onChange={handleFileInputChange}
            className="hidden"
            aria-hidden="true"
          />

          {/* File validation error */}
          {fileValidationError && (
            <StaticAlert
              variant="error"
              message={fileValidationError}
              onDismiss={handleClearFile}
              className="mt-4"
            />
          )}

          {/* Thumbnail upload */}
          <div className="mt-4">
            <ThumbnailUpload
              onFileSelected={handleThumbnailSelected}
              onClear={handleThumbnailClear}
              isUploading={state.thumbnailUploading}
              uploadProgress={state.thumbnailProgress}
              selectedFile={state.thumbnailFile}
              errorMessage={state.thumbnailError}
            />
          </div>

          {/* Metadata form with submit button */}
          <VideoMetadataForm
            hasFile={hasValidFile}
            onSubmit={handleSubmit}
            onCancel={handleClose}
            isSubmitting={state.thumbnailUploading}
          />
        </>
      )}
    </Modal>
  );
};
