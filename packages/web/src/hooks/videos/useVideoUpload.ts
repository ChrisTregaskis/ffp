import { useCallback, useRef, useState } from 'react';

import type { CreateVideoInput } from '@ffp/core';

import { useToast } from '@web/hooks/useToast';
import { adminVideosApi } from '@web/lib/api';
import { createLogger } from '@web/lib/logger';

import { uploadVideoFile } from './helpers/uploadVideoFile';
import { useVideoFileSelection } from './useVideoFileSelection';

import type { VideoMetadataValues } from './types';

const logger = createLogger('useVideoUpload');

type UploadPhase = 'idle' | 'uploading' | 'creating' | 'success' | 'error';

interface UploadProgress {
  phase: UploadPhase;
  uploadProgress: number;
  submitError: string | null;
  createdVideoId: string | null;
}

export interface UseVideoUploadReturn {
  fileSelection: ReturnType<typeof useVideoFileSelection>;
  progress: UploadProgress;
  /** Drag-and-drop handlers */
  isDragOver: boolean;
  handleDragOver: (event: React.DragEvent) => void;
  handleDragLeave: (event: React.DragEvent) => void;
  handleDrop: (event: React.DragEvent) => void;
  /** Called by the form with user-entered metadata — orchestrates upload + create */
  handleSubmit: (metadata: VideoMetadataValues) => void;
  handleClose: () => void;
  handleReset: () => void;
  /** File is selected and passes validation */
  hasValidFile: boolean;
  /** Modal is not busy with upload/create */
  canClose: boolean;
}

export const useVideoUpload = (
  onClose: () => void,
  onVideoCreated?: () => void
): UseVideoUploadReturn => {
  const fileSelection = useVideoFileSelection();
  const xhrRef = useRef<XMLHttpRequest | null>(null);

  const [isDragOver, setIsDragOver] = useState(false);
  const [progress, setProgress] = useState<UploadProgress>({
    phase: 'idle',
    uploadProgress: 0,
    submitError: null,
    createdVideoId: null,
  });

  const { addToast } = useToast();

  const hasValidFile = fileSelection.file !== null && fileSelection.validationError === null;
  const isBusy = progress.phase === 'uploading' || progress.phase === 'creating';
  const canClose = !isBusy;

  // --- Drag-and-drop ---

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
        fileSelection.selectFile(event.dataTransfer.files[0]);
      }
    },
    [fileSelection]
  );

  // --- Submit: upload video to S3 then create record ---

  const handleSubmit = useCallback(
    (metadata: VideoMetadataValues) => {
      const { file, detectedDuration } = fileSelection;

      if (!file || fileSelection.validationError) {
        return;
      }

      if (detectedDuration === null) {
        addToast('Could not detect video duration. Please try a different file.', {
          variant: 'error',
        });

        return;
      }

      setProgress((prev) => ({
        ...prev,
        phase: 'uploading',
        uploadProgress: 0,
        submitError: null,
      }));

      uploadVideoFile({
        file,
        onProgress: (percent) => {
          setProgress((prev) => ({ ...prev, uploadProgress: percent }));
        },
        xhrRef,
      })
        .then(({ videoS3Key }) => {
          setProgress((prev) => ({ ...prev, phase: 'creating' }));

          const input: CreateVideoInput = {
            title: metadata.title,
            s3Key: videoS3Key,
            fileSizeBytes: file.size,
            durationSeconds: detectedDuration,
            bodyParts: metadata.bodyParts,
            equipment: metadata.equipment,
            mimeType: 'video/mp4',
            status: 'draft',
            description: metadata.description,
            movementType: metadata.movementType,
            difficulty: metadata.difficulty,
            tags: metadata.tags,
          };

          return adminVideosApi.createVideo(input);
        })
        .then((response) => {
          logger.debug('Video created successfully', { videoId: response.video.id });

          setProgress((prev) => ({
            ...prev,
            phase: 'success',
            createdVideoId: response.video.publicId,
          }));
          addToast('Video created successfully', { variant: 'success' });
          onVideoCreated?.();
        })
        .catch((error: unknown) => {
          const message =
            error instanceof Error ? error.message : 'Upload failed. Please try again.';
          logger.error('Upload/create failed', { error: message });
          setProgress((prev) => ({ ...prev, phase: 'error', submitError: message }));
        });
    },
    [fileSelection, addToast, onVideoCreated]
  );

  // --- Page lifecycle ---

  const resetAll = useCallback(() => {
    if (xhrRef.current) {
      xhrRef.current.abort();
      xhrRef.current = null;
    }

    fileSelection.clearFile();
    setProgress({ phase: 'idle', uploadProgress: 0, submitError: null, createdVideoId: null });
  }, [fileSelection]);

  const handleClose = useCallback(() => {
    if (isBusy) {
      return;
    }

    resetAll();
    onClose();
  }, [isBusy, resetAll, onClose]);

  const handleReset = useCallback(() => {
    resetAll();
  }, [resetAll]);

  return {
    fileSelection,
    progress,
    isDragOver,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleSubmit,
    handleClose,
    handleReset,
    hasValidFile,
    canClose,
  };
};
