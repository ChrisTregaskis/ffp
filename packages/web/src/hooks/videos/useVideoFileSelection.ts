import { useCallback, useRef, useState } from 'react';

import { detectVideoDuration } from './helpers/detectVideoDuration';
import { validateVideoFile } from './helpers/validateVideoFile';

export interface VideoFileSelection {
  /** Selected file (null if none) */
  file: File | null;
  /** Validation error message (null if valid or no file) */
  validationError: string | null;
  /** Duration in seconds detected from video metadata (null if pending or failed) */
  detectedDuration: number | null;
  /** Whether a valid file is selected and duration has been detected */
  isReady: boolean;
  /** Select and validate a video file, then auto-detect duration */
  selectFile: (file: File) => void;
  /** Clear the selected file and reset state */
  clearFile: () => void;
}

/**
 * Composable hook for video file selection, validation, and duration detection.
 *
 * Shared by both the upload page (useVideoUpload) and the replacement flow (useVideoReplacement).
 * Handles: file validation (MP4, ≤500 MB) and automatic duration detection.
 */
export const useVideoFileSelection = (): VideoFileSelection => {
  const [file, setFile] = useState<File | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [detectedDuration, setDetectedDuration] = useState<number | null>(null);
  const selectedFileRef = useRef<File | null>(null);

  const selectFile = useCallback((selectedFile: File) => {
    const error = validateVideoFile(selectedFile);
    selectedFileRef.current = selectedFile;
    setFile(selectedFile);
    setValidationError(error);
    setDetectedDuration(null);

    if (!error) {
      void detectVideoDuration(selectedFile).then((duration) => {
        // A slower probe of an earlier choice must not land on the file chosen since
        if (selectedFileRef.current !== selectedFile) {
          return;
        }

        if (duration === null) {
          setValidationError("We couldn't read this video's length. Please try a different file.");
        } else {
          setDetectedDuration(duration);
        }
      });
    }
  }, []);

  const clearFile = useCallback(() => {
    selectedFileRef.current = null;
    setFile(null);
    setValidationError(null);
    setDetectedDuration(null);
  }, []);

  const isReady = file !== null && validationError === null && detectedDuration !== null;

  return {
    file,
    validationError,
    detectedDuration,
    isReady,
    selectFile,
    clearFile,
  };
};
