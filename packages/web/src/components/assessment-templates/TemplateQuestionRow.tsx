import React, { useMemo } from 'react';

import type { TemplateQuestionResponse } from '@ffp/core';

import { Badge, Surface, Text } from '@web/components/atoms';
import { KebabMenu } from '@web/components/organisms';
import type { DropdownMenuItem } from '@web/components/organisms';
import { QUESTION_TYPE_LABELS } from '@web/constants';
import { REORDERABLE_ACTION_LABELS } from '@web/utils/reorderable-item-actions';

export interface TemplateQuestionRowProps {
  question: TemplateQuestionResponse;
  /** 1-based position in the template */
  position: number;
  isFirst: boolean;
  isLast: boolean;
  onOpen: (questionPublicId: string) => void;
  onMoveUp: (questionPublicId: string) => void;
  onMoveDown: (questionPublicId: string) => void;
  onRemove: (question: TemplateQuestionResponse) => void;
  isMutating?: boolean;
}

/** One question assigned to a template, with its position, type and actions. */
export const TemplateQuestionRow: React.FC<TemplateQuestionRowProps> = ({
  question,
  position,
  isFirst,
  isLast,
  onOpen,
  onMoveUp,
  onMoveDown,
  onRemove,
  isMutating = false,
}) => {
  const menuItems: DropdownMenuItem[] = useMemo(
    () => [
      {
        label: 'Open in question bank',
        onClick: () => {
          onOpen(question.publicId);
        },
      },
      {
        label: REORDERABLE_ACTION_LABELS.moveUp,
        onClick: () => {
          onMoveUp(question.publicId);
        },
        disabled: isFirst,
      },
      {
        label: REORDERABLE_ACTION_LABELS.moveDown,
        onClick: () => {
          onMoveDown(question.publicId);
        },
        disabled: isLast,
      },
      {
        label: 'Remove from template',
        onClick: () => {
          onRemove(question);
        },
        variant: 'danger',
      },
    ],
    [question, isFirst, isLast, onOpen, onMoveUp, onMoveDown, onRemove]
  );

  return (
    <Surface radius="md" padding="row" className="flex items-center gap-3">
      <Text
        styleProps={{ size: 'xs', colour: 'muted-foreground', weight: 'medium' }}
        className="w-5 shrink-0 text-center"
      >
        {String(position)}
      </Text>

      <div className="min-w-0 flex-1">
        <Text as="p" styleProps={{ size: 'sm', weight: 'medium' }}>
          {question.questionText}
        </Text>
        <Text as="p" styleProps={{ size: 'xs', colour: 'muted-foreground' }}>
          {question.slug}
        </Text>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        {!question.isActive && <Badge variant="warning" label="Inactive" />}
        <Badge label={QUESTION_TYPE_LABELS[question.type]} />
        <KebabMenu items={menuItems} disabled={isMutating} />
      </div>
    </Surface>
  );
};
