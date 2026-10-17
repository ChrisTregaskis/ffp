import React from 'react';

import { Button, Text } from '@web/components/atoms';

import { Modal } from '../Modal';

import type { ReactNode } from 'react';

export interface ConfirmModalProps {
  /** Whether the modal is visible */
  isOpen: boolean;
  /** Callback when the modal should close (cancel, backdrop or Escape) */
  onClose: () => void;
  /** Callback when the user confirms */
  onConfirm: () => void;
  title: string;
  subtitle?: string;
  /** What confirming will do, shown as the body's first paragraph */
  message: string;
  confirmLabel: string;
  /** Defaults to "Cancel" */
  cancelLabel?: string;
  /** Whether the confirmed action is in progress */
  isLoading?: boolean;
  confirmDisabled?: boolean;
  hideDividers?: boolean;
  /** Anything shown under the message, such as warnings */
  children?: ReactNode;
}

/** Asks the user to confirm a destructive action before it runs. */
export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  subtitle,
  message,
  confirmLabel,
  cancelLabel = 'Cancel',
  isLoading = false,
  confirmDisabled = false,
  hideDividers = false,
  children,
}) => (
  <Modal
    isOpen={isOpen}
    onClose={onClose}
    title={title}
    subtitle={subtitle}
    size="sm"
    hideDividers={hideDividers}
    footer={
      <>
        <Button variant="secondary" onClick={onClose}>
          {cancelLabel}
        </Button>
        <Button
          variant="destructive"
          onClick={onConfirm}
          loading={isLoading}
          disabled={confirmDisabled}
        >
          {confirmLabel}
        </Button>
      </>
    }
  >
    <Text as="p" styleProps={{ colour: 'muted-foreground' }}>
      {message}
    </Text>
    {children}
  </Modal>
);
