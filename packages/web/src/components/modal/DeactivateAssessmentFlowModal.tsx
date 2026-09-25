import React from 'react';

import { Button } from '@web/components/button';
import { Text } from '@web/components/text';

import { Modal } from './Modal';

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
  <Modal
    isOpen={isOpen}
    onClose={onClose}
    title="Deactivate Flow"
    subtitle={flowName}
    size="sm"
    footer={
      <>
        <Button variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button variant="destructive" onClick={onConfirm} loading={isLoading}>
          Deactivate Flow
        </Button>
      </>
    }
  >
    <Text as="p" styleProps={{ colour: 'muted-foreground' }}>
      Members will no longer be offered this flow. Its steps and wording are kept, so you can bring
      it back into use later.
    </Text>
  </Modal>
);
