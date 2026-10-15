import React from 'react';

import { ConfirmModal } from '@web/components/organisms';

export interface DeactivateLocationModalProps {
  /** Whether the modal is visible */
  isOpen: boolean;
  /** Callback when the modal should close (cancel or backdrop) */
  onClose: () => void;
  /** Callback when the user confirms deactivation */
  onConfirm: () => void;
  /** Whether the deactivate action is in progress */
  isLoading?: boolean;
  /** Name of the location being deactivated */
  locationName: string;
}

/** Confirmation modal for taking a location out of use */
export const DeactivateLocationModal: React.FC<DeactivateLocationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  isLoading = false,
  locationName,
}) => (
  <ConfirmModal
    isOpen={isOpen}
    onClose={onClose}
    onConfirm={onConfirm}
    isLoading={isLoading}
    title="Deactivate Location"
    subtitle={locationName}
    message="Its details and members are kept, so you can activate it again later."
    confirmLabel="Deactivate Location"
  />
);
