import React from 'react';

import { ListEmptyState } from '@web/components/feedback/ListEmptyState';

interface VideoLibraryEmptyStateProps {
  /** Whether search or filter controls are active (changes messaging) */
  hasFilters: boolean;
  /** Callback when the upload button is clicked */
  onUploadClick: () => void;
}

export const VideoLibraryEmptyState: React.FC<VideoLibraryEmptyStateProps> = ({
  hasFilters,
  onUploadClick,
}) => (
  <ListEmptyState
    hasFilters={hasFilters}
    filteredTitle="No matching videos"
    icon="Video"
    iconColour="var(--color-muted-foreground)"
    title="No videos yet"
    description="Upload your first exercise video to start building the video library."
    actionLabel="Upload Video"
    actionIcon="Upload"
    onAction={onUploadClick}
  />
);
