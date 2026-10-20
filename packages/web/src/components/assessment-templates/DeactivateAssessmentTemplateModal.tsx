import React from 'react';

import { ConfirmModal } from '@web/components/organisms';

export interface DeactivateAssessmentTemplateModalProps {
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

/** Confirmation modal for taking an assessment template out of use */
export const DeactivateAssessmentTemplateModal: React.FC<
  DeactivateAssessmentTemplateModalProps
> = ({ isOpen, onClose, onConfirm, isLoading = false, templateName }) => (
  <ConfirmModal
    isOpen={isOpen}
    onClose={onClose}
    onConfirm={onConfirm}
    isLoading={isLoading}
    title="Deactivate Template"
    subtitle={templateName}
    message="It can no longer be chosen for a new flow step. Steps already using it keep it, and its questions are kept, so you can bring it back into use later."
    confirmLabel="Deactivate Template"
  />
);
