import { useCallback, useReducer, useRef } from 'react';

import type { CreateVideoInput } from '@ffp/core';

import { useToast } from '@web/hooks/useToast';
import { adminVideosApi } from '@web/lib/api';
import { createLogger } from '@web/lib/logger';

import type React from 'react';

const logger = createLogger('useUploadVideoModal');

/** Maximum video file size in bytes (500 MB) */
const MAX_FILE_SIZE_BYTES = 500 * 1024 * 1024;

/** Accepted video MIME type */
const ACCEPTED_VIDEO_MIME_TYPE = 'video/mp4';

/** Modal lifecycle phases */
export type ModalPhase = 'idle' | 'uploading' | 'creating' | 'success' | 'error';

/** User-entered metadata values from the form (no upload-derived fields) */
export interface VideoMetadataValues {
  title: string;
  description?: string;
  movementType?: string;
  difficulty?: string;
  bodyParts: string[];
  equipment: string[];
  tags: string[];
  durationSeconds: number;
}

export interface UploadVideoModalState {
  phase: ModalPhase;
  selectedFile: File | null;
  fileValidationError: string | null;
  isDragOver: boolean;
  uploadProgress: number;
  /** Duration in seconds detected from video file metadata (null if not yet detected or failed) */
  detectedDuration: number | null;
  thumbnailFile: File | null;
  thumbnailUploading: boolean;
  thumbnailProgress: number;
  thumbnailError: string | null;
  thumbnailKey: string | null;
  submitError: string | null;
}

export interface UseUploadVideoModalReturn {
  state: UploadVideoModalState;
  handleDragOver: (event: React.DragEvent) => void;
  handleDragLeave: (event: React.DragEvent) => void;
  handleDrop: (event: React.DragEvent) => void;
  handleFileInputChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  handleClickSelect: () => void;
  handleClearFile: () => void;
  handleThumbnailSelected: (file: File, extension: string) => void;
  handleThumbnailClear: () => void;
  /** Called by the form with user-entered metadata — orchestrates upload + create */
  handleSubmit: (metadata: VideoMetadataValues) => void;
  handleClose: () => void;
  handleReset: () => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
  /** File is selected and passes validation */
  hasValidFile: boolean;
  /** Modal is not busy with upload/create */
  canClose: boolean;
}

type Action =
  | { type: 'SET_DRAG_OVER'; isDragOver: boolean }
  | { type: 'SELECT_FILE'; file: File; error: string | null }
  | { type: 'CLEAR_FILE' }
  | { type: 'DURATION_DETECTED'; duration: number | null }
  | { type: 'UPLOAD_STARTED' }
  | { type: 'UPLOAD_PROGRESS'; progress: number }
  | { type: 'CREATE_STARTED' }
  | { type: 'CREATE_SUCCESS' }
  | { type: 'SUBMIT_ERROR'; error: string }
  | { type: 'THUMBNAIL_SELECTED'; file: File }
  | { type: 'THUMBNAIL_UPLOADING' }
  | { type: 'THUMBNAIL_PROGRESS'; progress: number }
  | { type: 'THUMBNAIL_COMPLETE'; thumbnailKey: string }
  | { type: 'THUMBNAIL_ERROR'; error: string }
  | { type: 'THUMBNAIL_CLEARED' }
  | { type: 'RESET' };

const INITIAL_STATE: UploadVideoModalState = {
  phase: 'idle',
  selectedFile: null,
  fileValidationError: null,
  isDragOver: false,
  uploadProgress: 0,
  detectedDuration: null,
  thumbnailFile: null,
  thumbnailUploading: false,
  thumbnailProgress: 0,
  thumbnailError: null,
  thumbnailKey: null,
  submitError: null,
};

function reducer(state: UploadVideoModalState, action: Action): UploadVideoModalState {
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
      return { ...state, phase: 'success' };

    case 'SUBMIT_ERROR':
      return { ...state, phase: 'error', submitError: action.error };

    case 'THUMBNAIL_SELECTED':
      return { ...state, thumbnailFile: action.file, thumbnailError: null };

    case 'THUMBNAIL_UPLOADING':
      return { ...state, thumbnailUploading: true, thumbnailProgress: 0 };

    case 'THUMBNAIL_PROGRESS':
      return { ...state, thumbnailProgress: action.progress };

    case 'THUMBNAIL_COMPLETE':
      return {
        ...state,
        thumbnailUploading: false,
        thumbnailProgress: 100,
        thumbnailKey: action.thumbnailKey,
      };

    case 'THUMBNAIL_ERROR':
      return { ...state, thumbnailUploading: false, thumbnailError: action.error };

    case 'THUMBNAIL_CLEARED':
      return {
        ...state,
        thumbnailFile: null,
        thumbnailUploading: false,
        thumbnailProgress: 0,
        thumbnailError: null,
        thumbnailKey: null,
      };

    case 'RESET':
      return INITIAL_STATE;

    default:
      return state;
  }
}

/** Format bytes to a human-readable string */
export const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${String(bytes)} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
};

/** Validate a selected video file and return an error message or null */
const validateVideoFile = (file: File): string | null => {
  if (file.type !== ACCEPTED_VIDEO_MIME_TYPE) {
    return `Invalid file type: ${file.type || 'unknown'}. Only MP4 files are accepted.`;
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    return `File is too large (${formatFileSize(file.size)}). Maximum size is 500 MB.`;
  }

  return null;
};

/** Detect video duration by loading file metadata in a temporary video element */
function detectVideoDuration(file: File): Promise<number | null> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement('video');
    video.preload = 'metadata';

    video.addEventListener('loadedmetadata', () => {
      URL.revokeObjectURL(url);
      const duration = Math.round(video.duration);
      resolve(isFinite(duration) && duration > 0 ? duration : null);
    });

    video.addEventListener('error', () => {
      URL.revokeObjectURL(url);
      resolve(null);
    });

    video.src = url;
  });
}

/** Upload a file to S3 via XHR PUT, returning a Promise for async orchestration */
function uploadToS3(
  file: File,
  presignedUrl: string,
  contentType: string,
  options: {
    onProgress: (percent: number) => void;
    xhrRef: React.MutableRefObject<XMLHttpRequest | null>;
  }
): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    options.xhrRef.current = xhr;

    xhr.upload.addEventListener('progress', (event) => {
      if (event.lengthComputable) {
        options.onProgress(Math.round((event.loaded / event.total) * 100));
      }
    });

    xhr.addEventListener('load', () => {
      options.xhrRef.current = null;

      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
      } else {
        reject(new Error(`Upload failed with status ${String(xhr.status)}. Please try again.`));
      }
    });

    xhr.addEventListener('error', () => {
      options.xhrRef.current = null;
      reject(new Error('Network error during upload. Please check your connection and try again.'));
    });

    xhr.addEventListener('abort', () => {
      options.xhrRef.current = null;
      reject(new Error('Upload cancelled.'));
    });

    xhr.open('PUT', presignedUrl);
    xhr.setRequestHeader('Content-Type', contentType);
    xhr.send(file);
  });
}

export const useUploadVideoModal = (
  onClose: () => void,
  onVideoCreated?: () => void
): UseUploadVideoModalReturn => {
  const [state, dispatch] = useReducer(reducer, INITIAL_STATE);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoXhrRef = useRef<XMLHttpRequest | null>(null);
  const thumbnailXhrRef = useRef<XMLHttpRequest | null>(null);

  // Ref to always read the latest state in async callbacks
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

  // --- Thumbnail ---

  const handleThumbnailSelected = useCallback((file: File, extension: string) => {
    dispatch({ type: 'THUMBNAIL_SELECTED', file });
    dispatch({ type: 'THUMBNAIL_UPLOADING' });

    adminVideosApi
      .getUploadUrl({ thumbnailExtension: extension as 'jpg' | 'jpeg' | 'png' })
      .then((response) => {
        if (!response.thumbnailUploadUrl || !response.thumbnailKey) {
          dispatch({ type: 'THUMBNAIL_ERROR', error: 'Failed to get thumbnail upload URL.' });
          return;
        }

        const thumbKey = response.thumbnailKey;
        const contentType = extension === 'png' ? 'image/png' : 'image/jpeg';

        uploadToS3(file, response.thumbnailUploadUrl, contentType, {
          onProgress: (percent) => {
            dispatch({ type: 'THUMBNAIL_PROGRESS', progress: percent });
          },
          xhrRef: thumbnailXhrRef,
        })
          .then(() => {
            logger.debug('Thumbnail upload complete', { thumbnailKey: thumbKey });
            dispatch({ type: 'THUMBNAIL_COMPLETE', thumbnailKey: thumbKey });
          })
          .catch((error: unknown) => {
            const message = error instanceof Error ? error.message : 'Thumbnail upload failed.';
            logger.error('Thumbnail upload failed', { error: message });
            dispatch({ type: 'THUMBNAIL_ERROR', error: message });
          });
      })
      .catch((error: unknown) => {
        const message = error instanceof Error ? error.message : 'Failed to upload thumbnail.';
        dispatch({ type: 'THUMBNAIL_ERROR', error: message });
      });
  }, []);

  const handleThumbnailClear = useCallback(() => {
    if (thumbnailXhrRef.current) {
      thumbnailXhrRef.current.abort();
      thumbnailXhrRef.current = null;
    }

    dispatch({ type: 'THUMBNAIL_CLEARED' });
  }, []);

  // --- Submit: upload video to S3 then create record ---

  const handleSubmit = useCallback(
    (metadata: VideoMetadataValues) => {
      const { selectedFile: file, fileValidationError, thumbnailKey: thumbKey } = stateRef.current;

      if (!file || fileValidationError) return;

      dispatch({ type: 'UPLOAD_STARTED' });

      // 1. Get presigned URL for the video
      adminVideosApi
        .getUploadUrl()
        .then((urlResponse) => {
          logger.debug('Presigned URL received', { videoS3Key: urlResponse.videoS3Key });

          // 2. Upload video file to S3
          return uploadToS3(file, urlResponse.videoUploadUrl, ACCEPTED_VIDEO_MIME_TYPE, {
            onProgress: (percent) => {
              dispatch({ type: 'UPLOAD_PROGRESS', progress: percent });
            },
            xhrRef: videoXhrRef,
          }).then(() => urlResponse);
        })
        .then((urlResponse) => {
          logger.debug('Video upload complete', { videoS3Key: urlResponse.videoS3Key });

          // 3. Create video record via API
          dispatch({ type: 'CREATE_STARTED' });

          const input: CreateVideoInput = {
            title: metadata.title,
            s3Key: urlResponse.videoS3Key,
            fileSizeBytes: file.size,
            durationSeconds: metadata.durationSeconds,
            bodyParts: metadata.bodyParts,
            equipment: metadata.equipment,
            mimeType: 'video/mp4',
            status: 'draft',
            description: metadata.description,
            movementType: metadata.movementType as CreateVideoInput['movementType'],
            difficulty: metadata.difficulty as CreateVideoInput['difficulty'],
            tags: metadata.tags,
            thumbnailKey: thumbKey ?? undefined,
          };

          return adminVideosApi.createVideo(input);
        })
        .then((response) => {
          logger.debug('Video created successfully', { videoId: response.video.id });
          dispatch({ type: 'CREATE_SUCCESS' });
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

  // --- Modal lifecycle ---

  const resetAll = useCallback(() => {
    if (videoXhrRef.current) {
      videoXhrRef.current.abort();
      videoXhrRef.current = null;
    }

    if (thumbnailXhrRef.current) {
      thumbnailXhrRef.current.abort();
      thumbnailXhrRef.current = null;
    }

    dispatch({ type: 'RESET' });
  }, []);

  const handleClose = useCallback(() => {
    if (isBusy) return;
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
    handleThumbnailSelected,
    handleThumbnailClear,
    handleSubmit,
    handleClose,
    handleReset,
    fileInputRef,
    hasValidFile,
    canClose,
  };
};
