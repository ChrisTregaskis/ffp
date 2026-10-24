import React, { useRef, useState } from 'react';

import { FileInput, Icon, PressableArea, Text } from '@web/components/atoms';

import type { DragEvent } from 'react';

export type FileDropzoneSize = 'default' | 'compact';

export interface FileDropzoneProps {
  /** Receives the dropped or browsed file */
  onFileSelect: (file: File) => void;
  /** File types the picker offers, as the input's `accept` attribute */
  accept: string;
  /** The invitation, such as "Drag and drop your video here" */
  title: string;
  /** Replaces the title while a file is dragged over */
  dropTitle: string;
  /** What the zone accepts, such as "MP4 format, up to 500 MB" */
  hint?: string;
  'aria-label': string;
  /** @default 'default' */
  size?: FileDropzoneSize;
  className?: string;
}

const SIZE_CLASSES: Record<FileDropzoneSize, string> = {
  default: 'p-10',
  compact: 'p-5',
};

/**
 * A drop target for one file that also opens the file picker on click or keyboard press.
 */
export const FileDropzone: React.FC<FileDropzoneProps> = ({
  onFileSelect,
  accept,
  title,
  dropTitle,
  hint,
  'aria-label': ariaLabel,
  size = 'default',
  className = '',
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const isCompact = size === 'compact';

  const handleDragOver = (event: DragEvent): void => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (event: DragEvent): void => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (event: DragEvent): void => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragOver(false);

    if (event.dataTransfer.files.length > 0) {
      onFileSelect(event.dataTransfer.files[0]);
    }
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
    const file = event.target.files?.[0];

    if (file) {
      onFileSelect(file);
    }

    // Clearing the value lets the same file be chosen again after it is removed
    event.target.value = '';
  };

  return (
    <>
      <PressableArea
        onDragOver={handleDragOver}
        onDragEnter={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        aria-label={ariaLabel}
        className={`flex w-full flex-col items-center rounded-lg border-2 border-dashed transition-colors ${SIZE_CLASSES[size]} ${
          isDragOver
            ? 'border-primary bg-primary/5'
            : 'border-border bg-card hover:border-primary/50 hover:bg-muted/30'
        } ${className}`.trim()}
      >
        <span className={isCompact ? 'mb-2' : 'mb-3'}>
          <Icon
            name="Upload"
            styleProps={{
              size: isCompact ? 'lg' : 'xl',
              colour: isDragOver ? 'var(--color-primary)' : 'var(--color-muted-foreground)',
            }}
          />
        </span>
        <Text styleProps={{ weight: 'medium', size: isCompact ? 'sm' : 'lg' }} className="mb-1">
          {isDragOver ? dropTitle : title}
        </Text>
        <Text styleProps={{ colour: 'muted-foreground', size: 'sm' }}>
          or click to browse files
        </Text>
        {hint && (
          <Text styleProps={{ colour: 'muted-foreground', size: 'xs' }} className="mt-2">
            {hint}
          </Text>
        )}
      </PressableArea>

      <FileInput
        forwardedRef={inputRef}
        accept={accept}
        onChange={handleInputChange}
        aria-hidden="true"
        tabIndex={-1}
      />
    </>
  );
};
