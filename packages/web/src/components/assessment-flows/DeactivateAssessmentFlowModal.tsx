import React from 'react';

import { ConfirmModal } from '@web/components/organisms';

export interface DeactivateAssessmentFlowModalProps {
  /** Whether the modal is visible */
  isOpen: boolean;
  /** Callback when the modal should close (cancel or backdrop) */
  onClose: () => void;
  /** Callback when the user confirms deactivation */
  onConfirm: () => void;
  /** Whether the deactivate action is in progress */
  isLoading?: boolean;
  /** Name of the flow being deactivated */
  flowName: string;
}

/** Confirmation modal for taking an assessment flow out of use */
export const DeactivateAssessmentFlowModal: React.FC<DeactivateAssessmentFlowModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  isLoading = false,
  flowName,
}) => (
  <ConfirmModal
    isOpen={isOpen}
    onClose={onClose}
    onConfirm={onConfirm}
    isLoading={isLoading}
    title="Deactivate Flow"
    subtitle={flowName}
    message="Members will no longer be offered this flow. Its steps and wording are kept, so you can bring it back into use later."
    confirmLabel="Deactivate Flow"
  />
);
