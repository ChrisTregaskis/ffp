import React from 'react';

import { ConfirmModal } from './ConfirmModal';

export interface ArchiveVideoModalProps {
  /** Whether the modal is visible */
  isOpen: boolean;
  /** Callback when the modal should close (cancel or backdrop) */
  onClose: () => void;
  /** Callback when the user confirms archiving */
  onConfirm: () => void;
  /** Whether the archive action is in progress */
  isLoading?: boolean;
}

/** Confirmation modal for archiving a video from the public catalogue */
export const ArchiveVideoModal: React.FC<ArchiveVideoModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  isLoading = false,
}) => (
  <ConfirmModal
    isOpen={isOpen}
    onClose={onClose}
    onConfirm={onConfirm}
    isLoading={isLoading}
    title="Archive Video"
    subtitle="This will remove the video from the public catalogue."
    message="Archived videos will no longer be available in the public catalogue. You can restore them later by changing the status back to active."
    confirmLabel="Archive Video"
  />
);
