import React from 'react';

import { ConfirmModal } from './ConfirmModal';

export interface DeleteConfirmModalProps {
  /** Whether the modal is visible */
  isOpen: boolean;
  /** Callback when the modal should close */
  onClose: () => void;
  /** Callback when the user confirms deletion */
  onConfirm: () => void;
  /** Whether the delete action is in progress */
  isLoading?: boolean;
  /** Modal title e.g. "Delete Phase" */
  title: string;
  /** Warning message about cascade effects */
  message: string;
}

/** Confirmation modal for deleting a named item, with the cascade copy supplied by the caller */
export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  isLoading = false,
  title,
  message,
}) => (
  <ConfirmModal
    isOpen={isOpen}
    onClose={onClose}
    onConfirm={onConfirm}
    isLoading={isLoading}
    title={title}
    message={message}
    confirmLabel="Delete"
    hideDividers
  />
);
