import React, { useCallback, useRef, useState } from 'react';

import { Button } from '@web/components/button';
import { StaticAlert } from '@web/components/feedback/StaticAlert';
import { Icon } from '@web/components/Icon';
import { Text } from '@web/components/text';
import { formatFileSize } from '@web/utils/format';

/** Maximum thumbnail file size in bytes (5 MB) */
const MAX_THUMBNAIL_SIZE = 5 * 1024 * 1024;

/** Accepted image MIME types */
const ACCEPTED_TYPES = ['image/jpeg', 'image/png'];

/** Map MIME type to extension for the presigned URL request */
const MIME_TO_EXTENSION: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
};

export interface ThumbnailUploadProps {
  /** Called when a valid thumbnail file is selected */
  onFileSelected: (file: File, extension: string) => void;
  /** Called when the thumbnail is cleared */
  onClear: () => void;
  /** Whether a thumbnail upload is in progress */
  isUploading?: boolean;
  /** Upload progress percentage (0-100) */
  uploadProgress?: number;
  /** Currently selected thumbnail file (for preview) */
  selectedFile?: File | null;
  /** Error message to display */
  errorMessage?: string | null;
}

/**
 * Optional thumbnail image picker for the upload video modal.
 *
 * Supports JPEG/PNG files up to 5 MB. Shows a preview after selection.
 * The actual upload to S3 is handled by the parent component.
 */
export const ThumbnailUpload: React.FC<ThumbnailUploadProps> = ({
  onFileSelected,
  onClear,
  isUploading = false,
  uploadProgress = 0,
  selectedFile,
  errorMessage,
}) => {
  const [validationError, setValidationError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];

      event.target.value = '';

      if (!file) {
        return;
      }

      // Validate type
      if (!ACCEPTED_TYPES.includes(file.type)) {
        setValidationError('Only JPEG and PNG images are accepted.');

        return;
      }

      // Validate size
      if (file.size > MAX_THUMBNAIL_SIZE) {
        setValidationError(
          `Image is too large (${formatFileSize(file.size)}). Maximum size is 5 MB.`
        );

        return;
      }

      setValidationError(null);

      // Create preview URL
      const url = URL.createObjectURL(file);

      setPreviewUrl(url);

      const extension = MIME_TO_EXTENSION[file.type] ?? 'jpg';

      onFileSelected(file, extension);
    },
    [onFileSelected]
  );

  const handleClear = useCallback(() => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    setPreviewUrl(null);
    setValidationError(null);
    onClear();
  }, [previewUrl, onClear]);

  const handleOpenFilePicker = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const hasFile = selectedFile !== null && selectedFile !== undefined;

  return (
    <div className="mb-4">
      <Text
        as="p"
        styleProps={{ size: 'sm', weight: 'medium', colour: 'muted-foreground' }}
        className="mb-1"
      >
        Thumbnail (optional)
      </Text>

      {/* Preview state */}
      {hasFile && previewUrl && (
        <div className="flex items-start gap-4 rounded-lg border border-border bg-muted/30 p-3">
          <img
            src={previewUrl}
            alt="Thumbnail preview"
            className="h-20 w-20 rounded-md object-cover"
          />
          <div className="flex-1">
            <Text styleProps={{ weight: 'medium', size: 'sm' }}>{selectedFile.name}</Text>
            <Text as="p" styleProps={{ colour: 'muted-foreground', size: 'xs' }}>
              {formatFileSize(selectedFile.size)}
            </Text>
            {isUploading && (
              <div className="mt-2">
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary transition-all duration-300 ease-out"
                    style={{ width: `${String(uploadProgress)}%` }}
                    role="progressbar"
                    aria-valuenow={uploadProgress}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label="Thumbnail upload progress"
                  />
                </div>
              </div>
            )}
          </div>
          {!isUploading && (
            <Button variant="neutral" size="sm" onClick={handleClear}>
              Remove
            </Button>
          )}
        </div>
      )}

      {/* File picker state */}
      {!hasFile && (
        <Button
          variant="ghost"
          fullWidth
          onClick={handleOpenFilePicker}
          className="h-auto! justify-start! gap-3 rounded-lg border border-border p-3 hover:border-primary/50 hover:bg-muted/30"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-muted">
            <Icon
              name="Camera"
              styleProps={{ size: 'md', colour: 'var(--color-muted-foreground)' }}
            />
          </div>
          <div className="text-left">
            <Text styleProps={{ size: 'sm', weight: 'medium' }}>Add thumbnail</Text>
            <Text as="p" styleProps={{ colour: 'muted-foreground', size: 'xs' }}>
              JPEG or PNG, up to 5 MB
            </Text>
          </div>
        </Button>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png"
        onChange={handleFileChange}
        className="hidden"
        aria-hidden="true"
      />

      {validationError && (
        <StaticAlert
          variant="error"
          message={validationError}
          onDismiss={() => {
            setValidationError(null);
          }}
          className="mt-2"
        />
      )}

      {errorMessage && <StaticAlert variant="error" message={errorMessage} className="mt-2" />}
    </div>
  );
};
