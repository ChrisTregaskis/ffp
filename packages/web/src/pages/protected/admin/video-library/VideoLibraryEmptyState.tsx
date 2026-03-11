import React from 'react';

import { Button } from '@web/components/button';
import { StatusResult } from '@web/components/feedback/StatusResult';
import { Icon } from '@web/components/Icon';

interface VideoLibraryEmptyStateProps {
  /** Whether search or filter controls are active (changes messaging) */
  hasFilters: boolean;
  /** Callback when the upload button is clicked */
  onUploadClick: () => void;
}

export const VideoLibraryEmptyState: React.FC<VideoLibraryEmptyStateProps> = ({
  hasFilters,
  onUploadClick,
}) => {
  if (hasFilters) {
    return (
      <StatusResult
        icon="Search"
        iconColour="var(--color-muted-foreground)"
        iconBg="bg-transparent"
        title="No matching videos"
        description="Try adjusting your search or filters to find what you are looking for."
      />
    );
  }

  return (
    <StatusResult
      icon="Video"
      iconColour="var(--color-muted-foreground)"
      iconBg="bg-transparent"
      title="No videos yet"
      description="Upload your first exercise video to start building the video library."
      actions={
        <Button
          variant="secondary"
          icon={<Icon name="Upload" styleProps={{ size: 'sm', colour: 'currentColor' }} />}
          onClick={onUploadClick}
        >
          Upload Video
        </Button>
      }
    />
  );
};
