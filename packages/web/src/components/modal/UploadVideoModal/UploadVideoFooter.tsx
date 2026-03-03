import React from 'react';

import { Button } from '@web/components/button';
import { Icon } from '@web/components/Icon';

export interface UploadVideoFooterProps {
  /** Whether the upload can be initiated */
  canUpload: boolean;
  /** Whether an upload is currently in progress */
  isUploading: boolean;
  /** Handler for the upload button */
  onUpload: () => void;
  /** Handler for the cancel button */
  onCancel: () => void;
}

/** Footer actions for the upload video modal (Cancel + Upload) */
export const UploadVideoFooter: React.FC<UploadVideoFooterProps> = ({
  canUpload,
  isUploading,
  onUpload,
  onCancel,
}) => {
  return (
    <>
      <Button variant="secondary" onClick={onCancel} disabled={isUploading}>
        Cancel
      </Button>
      <Button
        variant="primary"
        disabled={!canUpload}
        loading={isUploading}
        icon={<Icon name="Upload" styleProps={{ size: 'sm', colour: 'currentColor' }} />}
        onClick={onUpload}
      >
        Upload Video
      </Button>
    </>
  );
};
