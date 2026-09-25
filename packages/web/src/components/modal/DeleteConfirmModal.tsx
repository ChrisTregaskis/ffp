import React from 'react';

import { Button } from '@web/components/button';
import { Text } from '@web/components/text';

import { Modal } from './Modal';

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

/** Confirmation modal for a destructive action on a named item, with the cascade copy supplied by the caller */
export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  isLoading = false,
  title,
  message,
}) => (
  <Modal
    isOpen={isOpen}
    onClose={onClose}
    title={title}
    size="sm"
    hideDividers
    footer={
      <>
        <Button variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button variant="destructive" onClick={onConfirm} loading={isLoading}>
          Delete
        </Button>
      </>
    }
  >
    <Text as="p" styleProps={{ colour: 'muted-foreground' }}>
      {message}
    </Text>
  </Modal>
);
