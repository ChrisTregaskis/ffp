import React from 'react';

import type { AdminQuestion } from '@ffp/core';

import { Checkbox, Label, Text } from '@web/components/atoms';
import { QUESTION_TYPE_LABELS } from '@web/constants';

export interface AssignableQuestionOptionProps {
  question: AdminQuestion;
  isSelected: boolean;
  onToggle: (questionPublicId: string) => void;
}

/** One question in the picker: a checkbox labelled with its text, slug and type. */
export const AssignableQuestionOption: React.FC<AssignableQuestionOptionProps> = ({
  question,
  isSelected,
  onToggle,
}) => (
  <Label
    variant="option"
    className="flex cursor-pointer items-center gap-3 rounded-md px-2 py-2 hover:bg-muted"
    control={
      <Checkbox
        checked={isSelected}
        onChange={() => {
          onToggle(question.publicId);
        }}
      />
    }
  >
    <Text className="block" styleProps={{ size: 'sm', weight: 'medium' }}>
      {question.questionText}
    </Text>
    <Text className="block" styleProps={{ size: 'xs', colour: 'muted-foreground' }}>
      {`${question.slug} · ${QUESTION_TYPE_LABELS[question.type]}`}
    </Text>
  </Label>
);
