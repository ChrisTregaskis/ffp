import React from 'react';

import { ConfirmModal } from '@web/components/organisms';

export interface DeactivateTagModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isLoading?: boolean;
  tagLabel: string;
}

/** Confirmation modal for taking a tag out of use */
export const DeactivateTagModal: React.FC<DeactivateTagModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  isLoading = false,
  tagLabel,
}) => (
  <ConfirmModal
    isOpen={isOpen}
    onClose={onClose}
    onConfirm={onConfirm}
    isLoading={isLoading}
    title="Deactivate Tag"
    subtitle={tagLabel}
    message="It will no longer be offered on exercises. Exercises that already carry it keep it, and you can reactivate it at any time."
    confirmLabel="Deactivate tag"
  />
);
