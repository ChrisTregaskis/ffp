import type { DropdownMenuItem } from '@web/components/organisms';
import { REORDERABLE_ACTION_LABELS } from '@web/utils/reorderable-item-actions';

export interface MemberExerciseActionsOptions {
  onSwap: () => void;
  onEdit: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onRemove: () => void;
  isFirst: boolean;
  isLast: boolean;
}

/** The menu on an exercise in a member's session. Handlers arrive bound to the exercise. */
export const memberExerciseActions = ({
  onSwap,
  onEdit,
  onMoveUp,
  onMoveDown,
  onRemove,
  isFirst,
  isLast,
}: MemberExerciseActionsOptions): DropdownMenuItem[] => [
  { label: 'Swap', onClick: onSwap },
  { label: REORDERABLE_ACTION_LABELS.edit, onClick: onEdit },
  { label: REORDERABLE_ACTION_LABELS.moveUp, onClick: onMoveUp, disabled: isFirst },
  { label: REORDERABLE_ACTION_LABELS.moveDown, onClick: onMoveDown, disabled: isLast },
  { label: 'Remove', onClick: onRemove, variant: 'danger' },
];

export interface MemberSessionActionsOptions {
  onAddExercise: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  /** The session above has not started either, so the two can swap */
  canMoveUp: boolean;
  canMoveDown: boolean;
}

/** The menu on a member's session. */
export const memberSessionActions = ({
  onAddExercise,
  onMoveUp,
  onMoveDown,
  canMoveUp,
  canMoveDown,
}: MemberSessionActionsOptions): DropdownMenuItem[] => [
  { label: 'Add exercise', onClick: onAddExercise },
  { label: 'Move session up', onClick: onMoveUp, disabled: !canMoveUp },
  { label: 'Move session down', onClick: onMoveDown, disabled: !canMoveDown },
];
