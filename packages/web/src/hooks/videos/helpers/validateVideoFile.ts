import { formatFileSize } from '@web/utils/format';

/** Maximum video file size in bytes (500 MB) */
export const MAX_FILE_SIZE_BYTES = 500 * 1024 * 1024;

/** Accepted video MIME type */
export const ACCEPTED_VIDEO_MIME_TYPE = 'video/mp4';

/** Validate a selected video file and return an error message or null */
export const validateVideoFile = (file: File): string | null => {
  if (file.type !== ACCEPTED_VIDEO_MIME_TYPE) {
    return `Invalid file type: ${file.type || 'unknown'}. Only MP4 files are accepted.`;
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    return `File is too large (${formatFileSize(file.size)}). Maximum size is 500 MB.`;
  }

  return null;
};
