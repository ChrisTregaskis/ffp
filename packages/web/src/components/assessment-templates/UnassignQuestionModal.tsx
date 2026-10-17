import React from 'react';

import { ConfirmModal } from '@web/components/organisms';

export interface UnassignQuestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isLoading?: boolean;
  /** Text of the question being taken off the template */
  questionText: string;
}

/** Confirms taking a question off a template — "remove" reads as destructive, so the copy says what survives. */
export const UnassignQuestionModal: React.FC<UnassignQuestionModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  isLoading = false,
  questionText,
}) => (
  <ConfirmModal
    isOpen={isOpen}
    onClose={onClose}
    onConfirm={onConfirm}
    isLoading={isLoading}
    title="Remove from Template"
    subtitle={questionText}
    message="The question itself is kept in the question bank, unchanged, and can be added back at any time. Only its place in this template is removed."
    confirmLabel="Remove from Template"
  />
);
