import { adminVideosApi } from '@web/lib/api';
import { createLogger } from '@web/lib/logger';

import { uploadToS3 } from './uploadToS3';
import { ACCEPTED_VIDEO_MIME_TYPE } from './validateVideoFile';

import type React from 'react';

const logger = createLogger('uploadVideoFile');

export interface UploadVideoFileOptions {
  /** The video file to upload */
  file: File;
  /** Progress callback (0–100) */
  onProgress: (percent: number) => void;
  /** Ref to the XHR instance (for abort support) */
  xhrRef: React.MutableRefObject<XMLHttpRequest | null>;
}

export interface UploadVideoFileResult {
  /** S3 object key for the uploaded video */
  videoS3Key: string;
}

/**
 * Get a presigned URL and upload a video file to S3.
 *
 * Shared between the upload page (new video) and the replacement flow (existing video).
 * Returns the S3 key on success. Callers handle what to do next (create record vs update record).
 */
export const uploadVideoFile = async (
  options: UploadVideoFileOptions
): Promise<UploadVideoFileResult> => {
  const { file, onProgress, xhrRef } = options;

  const urlResponse = await adminVideosApi.getUploadUrl();
  logger.debug('Presigned URL received', { videoS3Key: urlResponse.videoS3Key });

  await uploadToS3(file, urlResponse.videoUploadUrl, ACCEPTED_VIDEO_MIME_TYPE, {
    onProgress,
    xhrRef,
  });

  logger.debug('Video upload complete', { videoS3Key: urlResponse.videoS3Key });

  return { videoS3Key: urlResponse.videoS3Key };
};
