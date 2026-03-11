import React from 'react';

import { Button } from '@web/components/button';
import { Text } from '@web/components/text';

import { Modal } from './Modal';

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
  <Modal
    isOpen={isOpen}
    onClose={onClose}
    title="Archive Video"
    subtitle="This will remove the video from the public catalogue."
    size="sm"
    footer={
      <>
        <Button variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button variant="destructive" onClick={onConfirm} loading={isLoading}>
          Archive Video
        </Button>
      </>
    }
  >
    <Text as="p" styleProps={{ colour: 'muted-foreground' }}>
      Archived videos will no longer be available in the public catalogue. You can restore them
      later by changing the status back to active.
    </Text>
  </Modal>
);
