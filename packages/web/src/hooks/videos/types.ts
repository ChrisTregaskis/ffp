import type React from 'react';

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

export type Action =
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
