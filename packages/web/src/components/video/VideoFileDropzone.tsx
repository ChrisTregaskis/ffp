import React from 'react';

import { FileDropzone } from '@web/components/molecules';
import type { FileDropzoneSize } from '@web/components/molecules';

export interface VideoFileDropzoneProps {
  onFileSelect: (file: File) => void;
  /** @default 'Drag and drop your video here' */
  title?: string;
  'aria-label': string;
  size?: FileDropzoneSize;
  className?: string;
}

/** The drop target for an exercise video file, shared by upload and replace. */
export const VideoFileDropzone: React.FC<VideoFileDropzoneProps> = ({
  title = 'Drag and drop your video here',
  ...props
}) => (
  <FileDropzone
    accept="video/mp4"
    title={title}
    dropTitle="Drop your video here"
    hint="MP4 format, up to 500 MB"
    {...props}
  />
);
