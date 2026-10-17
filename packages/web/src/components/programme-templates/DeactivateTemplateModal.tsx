import React from 'react';

import { ConfirmModal } from '@web/components/organisms';

export interface DeactivateTemplateModalProps {
  /** Whether the modal is visible */
  isOpen: boolean;
  /** Callback when the modal should close (cancel or backdrop) */
  onClose: () => void;
  /** Callback when the user confirms deactivation */
  onConfirm: () => void;
  /** Whether the deactivate action is in progress */
  isLoading?: boolean;
  /** Name of the template being deactivated */
  templateName: string;
}

/** Confirmation modal for taking a programme template out of use */
export const DeactivateTemplateModal: React.FC<DeactivateTemplateModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  isLoading = false,
  templateName,
}) => (
  <ConfirmModal
    isOpen={isOpen}
    onClose={onClose}
    onConfirm={onConfirm}
    isLoading={isLoading}
    title="Deactivate Template"
    subtitle={templateName}
    message="Members will no longer be given this programme. Its phases and sessions are kept, so you can activate it again later."
    confirmLabel="Deactivate Template"
  />
);
