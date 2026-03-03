import { useCallback, useRef, useState } from 'react';

import type { UploadUrlResponse } from '@ffp/core';

import { adminVideosApi } from '@web/lib/api';
import { createLogger } from '@web/lib/logger';

const logger = createLogger('useVideoUpload');

/** Upload progress state */
export type UploadStep = 'idle' | 'requesting-url' | 'uploading' | 'complete' | 'error';

export interface UploadState {
  /** Current step in the upload lifecycle */
  step: UploadStep;
  /** Upload progress percentage (0-100) */
  progress: number;
  /** Error message if upload failed */
  errorMessage: string | null;
  /** Presigned URL response (available after requesting-url step) */
  uploadUrlResponse: UploadUrlResponse | null;
}

export interface UseVideoUploadReturn {
  /** Current upload state */
  state: UploadState;
  /** Start the upload process for a file */
  startUpload: (file: File) => void;
  /** Reset to idle state */
  reset: () => void;
}

const INITIAL_STATE: UploadState = {
  step: 'idle',
  progress: 0,
  errorMessage: null,
  uploadUrlResponse: null,
};

/**
 * Custom hook for uploading a video file to S3 via presigned URL.
 *
 * Manages the full lifecycle:
 * 1. Fetch presigned URL from backend
 * 2. PUT file directly to S3 with XHR progress tracking
 * 3. Report completion or errors
 */
export const useVideoUpload = (): UseVideoUploadReturn => {
  const [state, setState] = useState<UploadState>(INITIAL_STATE);
  const xhrRef = useRef<XMLHttpRequest | null>(null);

  const reset = useCallback(() => {
    // Abort any in-flight XHR
    if (xhrRef.current) {
      xhrRef.current.abort();
      xhrRef.current = null;
    }

    setState(INITIAL_STATE);
  }, []);

  const startUpload = useCallback((file: File) => {
    // Request presigned URL
    setState({
      step: 'requesting-url',
      progress: 0,
      errorMessage: null,
      uploadUrlResponse: null,
    });

    adminVideosApi
      .getUploadUrl()
      .then((urlResponse) => {
        logger.debug('Presigned URL received', { videoS3Key: urlResponse.videoS3Key });

        setState((prev) => ({
          ...prev,
          step: 'uploading',
          uploadUrlResponse: urlResponse,
        }));

        // Upload file to S3 via XHR for progress tracking
        uploadToS3(file, urlResponse.videoUploadUrl, {
          onProgress: (progress) => {
            setState((prev) => ({ ...prev, progress }));
          },
          onComplete: () => {
            logger.debug('Upload complete', { videoS3Key: urlResponse.videoS3Key });

            setState((prev) => ({ ...prev, step: 'complete', progress: 100 }));
          },
          onError: (message) => {
            logger.error('Upload failed', { error: message });

            setState((prev) => ({ ...prev, step: 'error', errorMessage: message }));
          },
          xhrRef,
        });
      })
      .catch((error: unknown) => {
        const message =
          error instanceof Error ? error.message : 'Failed to get upload URL. Please try again.';
        logger.error('Failed to get presigned URL', { error: message });

        setState((prev) => ({
          ...prev,
          step: 'error',
          errorMessage: message,
        }));
      });
  }, []);

  return { state, startUpload, reset };
};

/** Upload a file to S3 via XHR PUT with progress tracking */
function uploadToS3(
  file: File,
  presignedUrl: string,
  options: {
    onProgress: (percent: number) => void;
    onComplete: () => void;
    onError: (message: string) => void;
    xhrRef: React.MutableRefObject<XMLHttpRequest | null>;
  }
): void {
  const xhr = new XMLHttpRequest();
  options.xhrRef.current = xhr;

  xhr.upload.addEventListener('progress', (event) => {
    if (event.lengthComputable) {
      const percent = Math.round((event.loaded / event.total) * 100);

      options.onProgress(percent);
    }
  });

  xhr.addEventListener('load', () => {
    options.xhrRef.current = null;

    if (xhr.status >= 200 && xhr.status < 300) {
      options.onComplete();
    } else {
      options.onError(`Upload failed with status ${String(xhr.status)}. Please try again.`);
    }
  });

  xhr.addEventListener('error', () => {
    options.xhrRef.current = null;
    options.onError('Network error during upload. Please check your connection and try again.');
  });

  xhr.addEventListener('abort', () => {
    options.xhrRef.current = null;
  });

  xhr.open('PUT', presignedUrl);
  xhr.setRequestHeader('Content-Type', 'video/mp4');
  xhr.send(file);
}
