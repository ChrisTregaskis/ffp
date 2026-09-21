import { describe, expect, it, vi } from 'vitest';

import { REORDERABLE_ACTION_LABELS, reorderableItemActions } from './reorderableItemActions';

type Options = Parameters<typeof reorderableItemActions>[0];

const buildOptions = (overrides: Partial<Options> = {}): Options => ({
  onEdit: vi.fn(),
  onMoveUp: vi.fn(),
  onMoveDown: vi.fn(),
  onDelete: vi.fn(),
  isFirst: false,
  isLast: false,
  ...overrides,
});

describe('reorderableItemActions', () => {
  it('builds the four actions in a fixed order, with the shared labels', () => {
    const items = reorderableItemActions(buildOptions());

    expect(items.map((item) => item.label)).toEqual([
      REORDERABLE_ACTION_LABELS.edit,
      REORDERABLE_ACTION_LABELS.moveUp,
      REORDERABLE_ACTION_LABELS.moveDown,
      REORDERABLE_ACTION_LABELS.delete,
    ]);
  });

  it('marks only delete as destructive', () => {
    const items = reorderableItemActions(buildOptions());

    expect(items.map((item) => item.variant)).toEqual([undefined, undefined, undefined, 'danger']);
  });

  it('enables both moves for an item in the middle of its list', () => {
    const [, moveUp, moveDown] = reorderableItemActions(buildOptions());

    expect(moveUp.disabled).toBe(false);
    expect(moveDown.disabled).toBe(false);
  });

  it('disables move up for the first item and move down for the last', () => {
    const [, firstUp, firstDown] = reorderableItemActions(buildOptions({ isFirst: true }));

    expect(firstUp.disabled).toBe(true);
    expect(firstDown.disabled).toBe(false);

    const [, lastUp, lastDown] = reorderableItemActions(buildOptions({ isLast: true }));

    expect(lastUp.disabled).toBe(false);
    expect(lastDown.disabled).toBe(true);
  });

  it('disables both moves when the whole list is unorderable, wherever the item sits', () => {
    const [, moveUp, moveDown] = reorderableItemActions(buildOptions({ reorderDisabled: true }));

    expect(moveUp.disabled).toBe(true);
    expect(moveDown.disabled).toBe(true);
  });

  it('leaves edit and delete enabled when reordering is disabled', () => {
    const [edit, , , remove] = reorderableItemActions(
      buildOptions({ reorderDisabled: true, isFirst: true, isLast: true })
    );

    expect(edit.disabled).toBeUndefined();
    expect(remove.disabled).toBeUndefined();
  });

  it('wires each action to its own handler', () => {
    const options = buildOptions();
    const [edit, moveUp, moveDown, remove] = reorderableItemActions(options);

    edit.onClick();
    moveUp.onClick();
    moveDown.onClick();
    remove.onClick();

    expect(options.onEdit).toHaveBeenCalledOnce();
    expect(options.onMoveUp).toHaveBeenCalledOnce();
    expect(options.onMoveDown).toHaveBeenCalledOnce();
    expect(options.onDelete).toHaveBeenCalledOnce();
  });
});
