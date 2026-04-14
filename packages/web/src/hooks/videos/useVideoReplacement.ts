import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useRef, useState } from 'react';

import { useToast } from '@web/hooks/useToast';
import { adminVideosApi } from '@web/lib/api';
import { createLogger } from '@web/lib/logger';
import { videoKeys } from '@web/lib/query';

import { uploadVideoFile } from './helpers/uploadVideoFile';
import { useVideoFileSelection } from './useVideoFileSelection';

import type { VideoFileSelection } from './useVideoFileSelection';

const logger = createLogger('useVideoReplacement');

type ReplacementPhase = 'idle' | 'uploading' | 'updating' | 'error';

interface ReplacementProgress {
  phase: ReplacementPhase;
  uploadProgress: number;
  error: string | null;
}

export interface UseVideoReplacementReturn {
  fileSelection: VideoFileSelection;
  progress: ReplacementProgress;
  handleConfirmReplace: () => void;
  handleClear: () => void;
  isBusy: boolean;
}

/**
 * Hook for replacing a video file on an existing video record.
 *
 * Composes useVideoFileSelection for file handling and uploadVideoFile for S3 upload.
 * After upload, updates the video record with the new S3 key, duration, and file size.
 */
export const useVideoReplacement = (
  videoId: string,
  publicId: string
): UseVideoReplacementReturn => {
  const fileSelection = useVideoFileSelection();
  const xhrRef = useRef<XMLHttpRequest | null>(null);

  const [progress, setProgress] = useState<ReplacementProgress>({
    phase: 'idle',
    uploadProgress: 0,
    error: null,
  });

  const { addToast } = useToast();
  const queryClient = useQueryClient();

  const isBusy = progress.phase === 'uploading' || progress.phase === 'updating';

  const handleClear = useCallback(() => {
    if (xhrRef.current) {
      xhrRef.current.abort();
      xhrRef.current = null;
    }

    fileSelection.clearFile();
    setProgress({ phase: 'idle', uploadProgress: 0, error: null });
  }, [fileSelection]);

  const handleConfirmReplace = useCallback(() => {
    const { file, detectedDuration } = fileSelection;

    if (!file || !fileSelection.isReady) {
      return;
    }

    if (detectedDuration === null) {
      addToast('Could not detect video duration. Please try a different file.', {
        variant: 'error',
      });

      return;
    }

    setProgress({ phase: 'uploading', uploadProgress: 0, error: null });

    uploadVideoFile({
      file,
      onProgress: (percent) => {
        setProgress((prev) => ({ ...prev, uploadProgress: percent }));
      },
      xhrRef,
    })
      .then(({ videoS3Key }) => {
        setProgress((prev) => ({ ...prev, phase: 'updating' }));

        return adminVideosApi.updateVideo(videoId, {
          s3Key: videoS3Key,
          durationSeconds: detectedDuration,
          fileSizeBytes: file.size,
          mimeType: 'video/mp4',
        });
      })
      .then(() => {
        addToast('Video replaced successfully', { variant: 'success' });

        fileSelection.clearFile();

        setProgress({ phase: 'idle', uploadProgress: 0, error: null });

        void queryClient.invalidateQueries({ queryKey: videoKeys.signedUrl(publicId) });
        void queryClient.invalidateQueries({ queryKey: videoKeys.detail(publicId) });
      })
      .catch((error: unknown) => {
        const message = error instanceof Error ? error.message : 'Video replacement failed.';

        logger.error('Video replacement failed', { error: message });

        addToast('Something went wrong replacing the video. Please try again.', {
          variant: 'error',
        });

        setProgress({
          phase: 'error',
          uploadProgress: 0,
          error: 'Video replacement failed. Please try again.',
        });
      });
  }, [videoId, publicId, fileSelection, addToast, queryClient]);

  return {
    fileSelection,
    progress,
    handleConfirmReplace,
    handleClear,
    isBusy,
  };
};
