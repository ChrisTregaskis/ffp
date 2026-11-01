import React, { useCallback, useState } from 'react';

import { Button, Surface, Text } from '@web/components/atoms';
import { FileSummary, UploadProgress } from '@web/components/molecules';
import { ConfirmModal } from '@web/components/organisms';
import { useVideoReplacement } from '@web/hooks/videos';
import { formatDuration } from '@web/utils/format';

import { VideoFileDropzone } from './VideoFileDropzone';

export interface VideoReplacerProps {
  publicId: string;
  className?: string;
}

/**
 * Video file replacement UI for the edit page.
 *
 * Idle: a compact drop zone below the video player.
 * Active: a panel with file info, progress, and a confirmation modal.
 */
export const VideoReplacer: React.FC<VideoReplacerProps> = ({ publicId, className }) => {
  const { fileSelection, progress, handleConfirmReplace, handleClear } =
    useVideoReplacement(publicId);
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

  const { file, validationError, detectedDuration, isReady } = fileSelection;
  const isIdle = progress.phase === 'idle' && !file;

  return (
    <div className={className}>
      {isIdle && (
        <VideoFileDropzone
          size="compact"
          title="Drag a replacement video here"
          onFileSelect={fileSelection.selectFile}
          aria-label="Select replacement video file"
        />
      )}

      {!isIdle && (
        <Surface padding="md">
          {file && (
            <FileSummary
              file={file}
              icon="Video"
              detail={detectedDuration != null ? formatDuration(detectedDuration) : undefined}
            />
          )}

          {validationError && (
            <Text as="p" styleProps={{ size: 'sm', colour: 'destructive' }} className="mt-2">
              {validationError}
            </Text>
          )}

          {progress.phase === 'uploading' && (
            <UploadProgress percent={progress.uploadProgress} className="mt-3" />
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

          {progress.phase === 'idle' && file && (
            <div className="mt-3 flex items-center gap-3">
              {!validationError && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleRequestReplace}
                  disabled={!isReady}
                  loading={!isReady}
                >
                  {isReady ? 'Replace video' : 'Detecting duration...'}
                </Button>
              )}
              <Button variant="ghost" size="sm" onClick={handleClear}>
                Cancel
              </Button>
            </div>
          )}
        </Surface>
      )}

      <ConfirmModal
        isOpen={showConfirm}
        onClose={handleCancelConfirm}
        onConfirm={handleConfirm}
        title="Replace Video"
        subtitle="This will replace the existing video file."
        message="The new upload replaces the current video file. Once it is saved, the current file is deleted, and this cannot be undone."
        confirmLabel="Confirm replacement"
      />
    </div>
  );
};
