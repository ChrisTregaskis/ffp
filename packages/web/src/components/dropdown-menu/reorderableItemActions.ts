import type { DropdownMenuItem } from './DropdownMenu';

/** Shared with the `RowAction` tables that cannot use the builder, so the labels cannot drift apart again. */
export const REORDERABLE_ACTION_LABELS = {
  edit: 'Edit',
  moveUp: 'Move up',
  moveDown: 'Move down',
  delete: 'Delete',
} as const;

export interface ReorderableItemActionsOptions {
  /** Opens the item for editing */
  onEdit: () => void;
  /** Swaps the item with the one above it */
  onMoveUp: () => void;
  /** Swaps the item with the one below it */
  onMoveDown: () => void;
  /** Starts the delete flow, usually by opening a confirmation modal */
  onDelete: () => void;
  /** The item sits at the top of its list, so it cannot move up */
  isFirst: boolean;
  /** The item sits at the bottom of its list, so it cannot move down */
  isLast: boolean;
  /** Nothing in this list can be reordered, whatever the item's position */
  reorderDisabled?: boolean;
}

/**
 * The action menu shared by the orderable items in the admin hierarchies — flow steps,
 * sessions and exercises. A plain function, not a hook: no state, no effect, and the
 * caller already memoises. Handlers arrive bound to the caller's own item.
 */
export const reorderableItemActions = ({
  onEdit,
  onMoveUp,
  onMoveDown,
  onDelete,
  isFirst,
  isLast,
  reorderDisabled = false,
}: ReorderableItemActionsOptions): DropdownMenuItem[] => [
  { label: REORDERABLE_ACTION_LABELS.edit, onClick: onEdit },
  {
    label: REORDERABLE_ACTION_LABELS.moveUp,
    onClick: onMoveUp,
    disabled: reorderDisabled || isFirst,
  },
  {
    label: REORDERABLE_ACTION_LABELS.moveDown,
    onClick: onMoveDown,
    disabled: reorderDisabled || isLast,
  },
  { label: REORDERABLE_ACTION_LABELS.delete, onClick: onDelete, variant: 'danger' },
];
