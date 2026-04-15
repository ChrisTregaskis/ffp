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
  /** Ref for a hidden file input element */
  fileInputRef: React.RefObject<HTMLInputElement>;
  /** onChange handler for a hidden file input */
  handleFileInputChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  /** Click the hidden file input to open the file picker */
  openFilePicker: () => void;
}

/**
 * Composable hook for video file selection, validation, and duration detection.
 *
 * Shared by both the upload page (useVideoUpload) and the replacement flow (useVideoReplacement).
 * Handles: file validation (MP4, ≤500 MB), automatic duration detection, and file input management.
 */
export const useVideoFileSelection = (): VideoFileSelection => {
  const [file, setFile] = useState<File | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [detectedDuration, setDetectedDuration] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const selectFile = useCallback((selectedFile: File) => {
    const error = validateVideoFile(selectedFile);
    setFile(selectedFile);
    setValidationError(error);
    setDetectedDuration(null);

    if (!error) {
      void detectVideoDuration(selectedFile).then((duration) => {
        setDetectedDuration(duration);
      });
    }
  }, []);

  const clearFile = useCallback(() => {
    setFile(null);
    setValidationError(null);
    setDetectedDuration(null);
  }, []);

  const handleFileInputChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const selected = event.target.files?.[0];

      if (selected) {
        selectFile(selected);
      }

      event.target.value = '';
    },
    [selectFile]
  );

  const openFilePicker = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const isReady = file !== null && validationError === null && detectedDuration !== null;

  return {
    file,
    validationError,
    detectedDuration,
    isReady,
    selectFile,
    clearFile,
    fileInputRef,
    handleFileInputChange,
    openFilePicker,
  };
};
