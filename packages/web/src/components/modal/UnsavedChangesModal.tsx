import React from 'react';

import { Button } from '@web/components/button';
import { Text } from '@web/components/text';

import { Modal } from './Modal';

export interface UnsavedChangesModalProps {
  /** Whether the modal is visible */
  isOpen: boolean;
  /** Callback to stay on the page with the edits intact */
  onStay: () => void;
  /** Callback to leave and discard the edits */
  onLeave: () => void;
}

/** Asks before navigating away from a form holding edits that have not been saved */
export const UnsavedChangesModal: React.FC<UnsavedChangesModalProps> = ({
  isOpen,
  onStay,
  onLeave,
}) => (
  <Modal
    isOpen={isOpen}
    onClose={onStay}
    title="Unsaved Changes"
    size="sm"
    footer={
      <>
        <Button variant="secondary" onClick={onStay}>
          Keep Editing
        </Button>
        <Button variant="destructive" onClick={onLeave}>
          Leave Without Saving
        </Button>
      </>
    }
  >
    <Text as="p" styleProps={{ colour: 'muted-foreground' }}>
      You have changes on this page that have not been saved. Leaving now will discard them.
    </Text>
  </Modal>
);
