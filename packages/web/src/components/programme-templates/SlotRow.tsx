import React, { useMemo } from 'react';

import type { SlotResponse } from '@ffp/core';

import { Badge, Surface, Text } from '@web/components/atoms';
import { KebabMenu } from '@web/components/organisms';
import type { DropdownMenuItem } from '@web/components/organisms';
import { toTagLabel } from '@web/components/tags';
import { reorderableItemActions } from '@web/utils/reorderable-item-actions';

export interface SlotRowProps {
  slot: SlotResponse;
  /** Whether this is the first slot in the session */
  isFirst: boolean;
  /** Whether this is the last slot in the session */
  isLast: boolean;
  onEdit: (publicId: string) => void;
  onDelete: (publicId: string) => void;
  onMoveUp: (publicId: string) => void;
  onMoveDown: (publicId: string) => void;
  /** Whether a mutation is in progress */
  isMutating?: boolean;
}

/** What a slot draws from, e.g. "Movement: Stretch, Mobility" or "Any movement" */
const describePool = (slot: SlotResponse): string =>
  slot.tags.length > 0
    ? `${slot.categoryLabel}: ${slot.tags.map(toTagLabel).join(', ')}`
    : `Any ${slot.categoryLabel.toLowerCase()}`;

/** Row describing a slot within a session: what it draws from, its tier, pool size and warnings. */
export const SlotRow: React.FC<SlotRowProps> = ({
  slot,
  isFirst,
  isLast,
  onEdit,
  onDelete,
  onMoveUp,
  onMoveDown,
  isMutating = false,
}) => {
  const menuItems: DropdownMenuItem[] = useMemo(
    () =>
      reorderableItemActions({
        onEdit: () => {
          onEdit(slot.publicId);
        },
        onMoveUp: () => {
          onMoveUp(slot.publicId);
        },
        onMoveDown: () => {
          onMoveDown(slot.publicId);
        },
        onDelete: () => {
          onDelete(slot.publicId);
        },
        isFirst,
        isLast,
      }),
    [slot.publicId, onEdit, onMoveUp, onMoveDown, onDelete, isFirst, isLast]
  );

  return (
    <Surface radius="md" padding="row" className="flex items-center gap-3">
      <Text
        styleProps={{ size: 'xs', colour: 'muted-foreground', weight: 'medium' }}
        className="w-5 shrink-0 text-center"
      >
        {String(slot.orderIndex + 1)}
      </Text>

      <div className="min-w-0 flex-1">
        <Text as="p" styleProps={{ size: 'sm', weight: 'medium' }} className="truncate">
          {slot.label ?? describePool(slot)}
        </Text>
        {slot.label && (
          <Text as="p" styleProps={{ size: 'xs', colour: 'muted-foreground' }} className="truncate">
            {describePool(slot)}
          </Text>
        )}
        <div className="mt-1 flex flex-wrap gap-1.5">
          <Badge
            label={slot.isRequired ? 'Required' : 'Optional'}
            variant={slot.isRequired ? 'primary' : 'muted'}
          />
          <Badge
            label={`${String(slot.poolSize)} ${slot.poolSize === 1 ? 'exercise' : 'exercises'} in pool`}
            variant="muted"
          />
          {slot.isPoolEmpty && (
            <Badge label="Empty pool" variant="destructive" icon="AlertTriangle" />
          )}
          {slot.hasInactiveTags && (
            <Badge label="Inactive tag" variant="warning" icon="AlertTriangle" />
          )}
        </div>
      </div>

      <div className="flex shrink-0 items-center">
        <KebabMenu items={menuItems} disabled={isMutating} />
      </div>
    </Surface>
  );
};
