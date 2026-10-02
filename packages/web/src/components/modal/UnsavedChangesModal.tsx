import React from 'react';

import { ConfirmModal } from './ConfirmModal';

export interface UnsavedChangesModalProps {
  /** Whether the modal is visible */
  isOpen: boolean;
  /** Callback to stay on the page with the edits intact */
  onStay: () => void;
  /** Callback to leave and discard the edits */
  onLeave: () => void;
}

/** Asks before navigating away from a form holding edits that have not been saved */
export const UnsavedChangesModal: React.FC<UnsavedChangesModalProps> = ({
  isOpen,
  onStay,
  onLeave,
}) => (
  <ConfirmModal
    isOpen={isOpen}
    onClose={onStay}
    onConfirm={onLeave}
    title="Unsaved Changes"
    message="You have changes on this page that have not been saved. Leaving now will discard them."
    confirmLabel="Leave Without Saving"
    cancelLabel="Keep Editing"
  />
);
