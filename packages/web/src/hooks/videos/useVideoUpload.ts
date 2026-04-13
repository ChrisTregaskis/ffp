import { useCallback, useReducer, useRef } from 'react';

import type { CreateVideoInput } from '@ffp/core';

import { useToast } from '@web/hooks/useToast';
import { adminVideosApi } from '@web/lib/api';
import { createLogger } from '@web/lib/logger';

import { detectVideoDuration } from './helpers/detectVideoDuration';
import { uploadToS3 } from './helpers/uploadToS3';
import { ACCEPTED_VIDEO_MIME_TYPE, validateVideoFile } from './helpers/validateVideoFile';

import type { Action, VideoUploadState, UseVideoUploadReturn, VideoMetadataValues } from './types';
import type React from 'react';

const logger = createLogger('useVideoUpload');

const INITIAL_STATE: VideoUploadState = {
  phase: 'idle',
  selectedFile: null,
  fileValidationError: null,
  isDragOver: false,
  uploadProgress: 0,
  detectedDuration: null,
  submitError: null,
  createdVideoId: null,
};

const reducer = (state: VideoUploadState, action: Action): VideoUploadState => {
  switch (action.type) {
    case 'SET_DRAG_OVER':
      return { ...state, isDragOver: action.isDragOver };

    case 'SELECT_FILE':
      return { ...state, selectedFile: action.file, fileValidationError: action.error };

    case 'CLEAR_FILE':
      return { ...state, selectedFile: null, fileValidationError: null, detectedDuration: null };

    case 'DURATION_DETECTED':
      return { ...state, detectedDuration: action.duration };

    case 'UPLOAD_STARTED':
      return { ...state, phase: 'uploading', uploadProgress: 0, submitError: null };

    case 'UPLOAD_PROGRESS':
      return { ...state, uploadProgress: action.progress };

    case 'CREATE_STARTED':
      return { ...state, phase: 'creating' };

    case 'CREATE_SUCCESS':
      return { ...state, phase: 'success', createdVideoId: action.videoId };

    case 'SUBMIT_ERROR':
      return { ...state, phase: 'error', submitError: action.error };

    case 'RESET':
      return INITIAL_STATE;

    default:
      return state;
  }
};

export const useVideoUpload = (
  onClose: () => void,
  onVideoCreated?: () => void
): UseVideoUploadReturn => {
  const [state, dispatch] = useReducer(reducer, INITIAL_STATE);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoXhrRef = useRef<XMLHttpRequest | null>(null);
  // Ref to always read the latest state in async callbacks (avoids stale closures
  // without adding state to useCallback deps, which would cause unnecessary re-renders)
  const stateRef = useRef(state);
  stateRef.current = state;

  const { addToast } = useToast();

  // Derived
  const hasValidFile = state.selectedFile !== null && state.fileValidationError === null;
  const isBusy = state.phase === 'uploading' || state.phase === 'creating';
  const canClose = !isBusy;

  // --- File selection ---

  const selectFile = useCallback((file: File) => {
    const error = validateVideoFile(file);
    dispatch({ type: 'SELECT_FILE', file, error });

    // Auto-detect duration from video metadata for valid files
    if (!error) {
      void detectVideoDuration(file).then((duration) => {
        dispatch({ type: 'DURATION_DETECTED', duration });
      });
    }
  }, []);

  const handleFileInputChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];

      if (file) {
        selectFile(file);
      }

      event.target.value = '';
    },
    [selectFile]
  );

  const handleClickSelect = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleClearFile = useCallback(() => {
    dispatch({ type: 'CLEAR_FILE' });
  }, []);

  // --- Drag-and-drop ---

  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    dispatch({ type: 'SET_DRAG_OVER', isDragOver: true });
  }, []);

  const handleDragLeave = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    dispatch({ type: 'SET_DRAG_OVER', isDragOver: false });
  }, []);

  const handleDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      event.stopPropagation();
      dispatch({ type: 'SET_DRAG_OVER', isDragOver: false });

      if (event.dataTransfer.files.length > 0) {
        selectFile(event.dataTransfer.files[0]);
      }
    },
    [selectFile]
  );

  // --- Submit: upload video to S3 then create record ---

  const handleSubmit = useCallback(
    (metadata: VideoMetadataValues) => {
      const { selectedFile: file, fileValidationError, detectedDuration } = stateRef.current;

      if (!file || fileValidationError) {
        return;
      }

      if (detectedDuration === null) {
        addToast('Could not detect video duration. Please try a different file.', {
          variant: 'error',
        });

        return;
      }

      dispatch({ type: 'UPLOAD_STARTED' });

      // Get presigned URL for the video
      adminVideosApi
        .getUploadUrl()
        .then((urlResponse) => {
          logger.debug('Presigned URL received', { videoS3Key: urlResponse.videoS3Key });

          // Upload video file to S3
          return uploadToS3(file, urlResponse.videoUploadUrl, ACCEPTED_VIDEO_MIME_TYPE, {
            onProgress: (percent) => {
              dispatch({ type: 'UPLOAD_PROGRESS', progress: percent });
            },
            xhrRef: videoXhrRef,
          }).then(() => urlResponse);
        })
        .then((urlResponse) => {
          logger.debug('Video upload complete', { videoS3Key: urlResponse.videoS3Key });

          // Create video record via API
          dispatch({ type: 'CREATE_STARTED' });

          const input: CreateVideoInput = {
            title: metadata.title,
            s3Key: urlResponse.videoS3Key,
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

          dispatch({ type: 'CREATE_SUCCESS', videoId: response.video.id });
          addToast('Video created successfully', { variant: 'success' });
          onVideoCreated?.();
        })
        .catch((error: unknown) => {
          const message =
            error instanceof Error ? error.message : 'Upload failed. Please try again.';
          logger.error('Upload/create failed', { error: message });
          dispatch({ type: 'SUBMIT_ERROR', error: message });
        });
    },
    [addToast, onVideoCreated]
  );

  // --- Page lifecycle ---

  const resetAll = useCallback(() => {
    if (videoXhrRef.current) {
      videoXhrRef.current.abort();
      videoXhrRef.current = null;
    }

    dispatch({ type: 'RESET' });
  }, []);

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
    state,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleFileInputChange,
    handleClickSelect,
    handleClearFile,
    handleSubmit,
    handleClose,
    handleReset,
    fileInputRef,
    hasValidFile,
    canClose,
  };
};
