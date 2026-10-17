import React from 'react';

import { ConfirmModal } from '@web/components/organisms';

export interface DeactivateOrganisationModalProps {
  /** Whether the modal is visible */
  isOpen: boolean;
  /** Callback when the modal should close (cancel or backdrop) */
  onClose: () => void;
  /** Callback when the user confirms deactivation */
  onConfirm: () => void;
  /** Whether the deactivate action is in progress */
  isLoading?: boolean;
  /** Name of the organisation being deactivated */
  organisationName: string;
}

/** Confirmation modal for taking an organisation out of use */
export const DeactivateOrganisationModal: React.FC<DeactivateOrganisationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  isLoading = false,
  organisationName,
}) => (
  <ConfirmModal
    isOpen={isOpen}
    onClose={onClose}
    onConfirm={onConfirm}
    isLoading={isLoading}
    title="Deactivate Organisation"
    subtitle={organisationName}
    message="Its locations and members are kept, so you can activate it again later."
    confirmLabel="Deactivate Organisation"
  />
);
