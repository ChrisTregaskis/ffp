import React from 'react';

import type { QuestionUsage } from '@ffp/core';

import { Button } from '@web/components/button';
import { StaticAlert } from '@web/components/feedback/StaticAlert';
import { Text } from '@web/components/text';
import { pluralise } from '@web/utils/string';

import { Modal } from './Modal';

export interface DeactivateQuestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isLoading?: boolean;
  questionText: string;
  /** Where the question is used; absent while it loads */
  usage?: QuestionUsage;
  /** The usage read failed — deactivation stays allowed, since it can be undone */
  usageCheckFailed?: boolean;
}

/** Confirmation modal for taking a question out of use, warning where it is still used. */
export const DeactivateQuestionModal: React.FC<DeactivateQuestionModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  isLoading = false,
  questionText,
  usage,
  usageCheckFailed = false,
}) => {
  const templateCount = usage?.templateCount ?? 0;
  const scoringFlowCount = usage?.scoringFlowCount ?? 0;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Deactivate Question"
      subtitle={questionText}
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            loading={isLoading}
            disabled={!usage && !usageCheckFailed}
          >
            Deactivate Question
          </Button>
        </>
      }
    >
      <Text as="p" styleProps={{ colour: 'muted-foreground' }}>
        Members will no longer be asked this question. Its wording, options and scores are kept, so
        you can bring it back into use later.
      </Text>

      {!usage && !usageCheckFailed && (
        <Text as="p" styleProps={{ size: 'sm', colour: 'muted-foreground' }} className="mt-3">
          Checking where this question is used…
        </Text>
      )}

      {usageCheckFailed && (
        <StaticAlert
          variant="warning"
          className="mt-3"
          message="We could not check where this question is used. You can still deactivate it, and reactivate it later if needed."
        />
      )}

      {templateCount > 0 && (
        <StaticAlert
          variant="warning"
          className="mt-3"
          message={`It is on ${pluralise(templateCount, 'assessment template', 'assessment templates')}. Members taking ${templateCount === 1 ? 'it' : 'them'} will stop seeing it.`}
        />
      )}

      {scoringFlowCount > 0 && (
        <StaticAlert
          variant="warning"
          className="mt-3"
          message={`${pluralise(scoringFlowCount, 'flow scores', 'flows score')} it. ${scoringFlowCount === 1 ? 'Its' : 'Their'} level results will stop counting its answers.`}
        />
      )}
    </Modal>
  );
};
