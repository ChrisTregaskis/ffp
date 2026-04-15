import React, { useCallback, useState } from 'react';

import { Button } from '@web/components/button/Button';
import { Modal } from '@web/components/modal/Modal';
import { ProgressBar } from '@web/components/ProgressBar';
import { Text } from '@web/components/text';
import { useVideoReplacement } from '@web/hooks/videos';
import { formatFileSize } from '@web/utils/format';

export interface VideoReplacerProps {
  /** UUID — used for the update API call */
  videoId: string;
  /** Public ID — used for cache invalidation (matches query keys) */
  publicId: string;
  className?: string;
}

/**
 * Video file replacement UI for the edit page.
 *
 * Idle: secondary button floated right below the video player.
 * Active: full-width panel with file info, progress, and confirmation modal.
 */
export const VideoReplacer: React.FC<VideoReplacerProps> = ({ videoId, publicId, className }) => {
  const { fileSelection, progress, handleConfirmReplace, handleClear } = useVideoReplacement(
    videoId,
    publicId
  );
  const [showConfirm, setShowConfirm] = useState(false);

  const handleRequestReplace = useCallback(() => {
    setShowConfirm(true);
  }, []);

  const handleCancelConfirm = useCallback(() => {
    setShowConfirm(false);
  }, []);

  const handleConfirm = useCallback(() => {
    setShowConfirm(false);
    handleConfirmReplace();
  }, [handleConfirmReplace]);

  const isIdle = progress.phase === 'idle' && !fileSelection.file;

  return (
    <div className={className}>
      <input
        ref={fileSelection.fileInputRef}
        type="file"
        accept="video/mp4"
        onChange={fileSelection.handleFileInputChange}
        className="hidden"
        aria-label="Select replacement video file"
      />

      {isIdle && (
        <div className="flex justify-end">
          <Button variant="secondary" size="sm" onClick={fileSelection.openFilePicker}>
            Replace video
          </Button>
        </div>
      )}

      {!isIdle && (
        <div className="rounded-lg border border-border bg-card p-4">
          {/* File info */}
          {fileSelection.file && (
            <div className="min-w-0">
              <Text
                as="p"
                styleProps={{ size: 'sm', weight: 'medium', colour: 'foreground' }}
                className="truncate"
              >
                {fileSelection.file.name}
              </Text>
              <Text as="p" styleProps={{ size: 'xs', colour: 'muted-foreground' }}>
                {formatFileSize(fileSelection.file.size)}
                {fileSelection.detectedDuration != null && (
                  <span>
                    {' · '}
                    {Math.floor(fileSelection.detectedDuration / 60)}:
                    {String(fileSelection.detectedDuration % 60).padStart(2, '0')}
                  </span>
                )}
              </Text>
            </div>
          )}

          {fileSelection.validationError && (
            <Text as="p" styleProps={{ size: 'sm', colour: 'destructive' }} className="mt-2">
              {fileSelection.validationError}
            </Text>
          )}

          {progress.phase === 'uploading' && (
            <div className="mt-3">
              <div className="flex items-center justify-between">
                <Text as="span" styleProps={{ size: 'xs', colour: 'muted-foreground' }}>
                  Uploading...
                </Text>
                <Text as="span" styleProps={{ size: 'xs', colour: 'muted-foreground' }}>
                  {progress.uploadProgress}%
                </Text>
              </div>
              <ProgressBar percent={progress.uploadProgress} className="mt-1" />
            </div>
          )}

          {progress.phase === 'updating' && (
            <Text as="p" styleProps={{ size: 'sm', colour: 'muted-foreground' }} className="mt-3">
              Updating video record...
            </Text>
          )}

          {progress.phase === 'error' && progress.error && (
            <div className="mt-3 flex items-center gap-3">
              <Button variant="secondary" size="sm" onClick={handleClear}>
                Try again
              </Button>
              <Text as="p" styleProps={{ size: 'sm', colour: 'destructive' }}>
                {progress.error}
              </Text>
            </div>
          )}

          {/* Actions — cancel and replace at the bottom */}
          {progress.phase === 'idle' && fileSelection.file && !fileSelection.validationError && (
            <div className="mt-3 flex items-center gap-3">
              <Button
                variant="primary"
                size="sm"
                onClick={handleRequestReplace}
                disabled={!fileSelection.isReady}
                loading={!fileSelection.isReady}
              >
                {fileSelection.isReady ? 'Replace video' : 'Detecting duration...'}
              </Button>
              <Button variant="ghost" size="sm" onClick={handleClear}>
                Cancel
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Confirmation modal */}
      <Modal
        isOpen={showConfirm}
        onClose={handleCancelConfirm}
        title="Replace Video"
        subtitle="This will replace the existing video file."
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={handleCancelConfirm}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleConfirm}>
              Confirm replacement
            </Button>
          </>
        }
      >
        <Text as="p" styleProps={{ colour: 'muted-foreground' }}>
          The current video file will be replaced with the new upload. This cannot be undone. The
          original file will no longer be available.
        </Text>
      </Modal>
    </div>
  );
};
