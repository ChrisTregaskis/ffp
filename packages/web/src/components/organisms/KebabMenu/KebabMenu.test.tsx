import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import type { MenuListItem } from '@web/components/molecules';

import { Modal } from '../Modal';

import { KebabMenu } from './KebabMenu';

const buildItems = (): { items: MenuListItem[]; onEdit: ReturnType<typeof vi.fn> } => {
  const onEdit = vi.fn();

  return {
    onEdit,
    items: [
      { label: 'Edit', onClick: onEdit },
      { label: 'Move up', onClick: vi.fn(), disabled: true },
      { label: 'Move down', onClick: vi.fn() },
      { label: 'Delete', onClick: vi.fn(), variant: 'danger' },
    ],
  };
};

const renderMenu = (): { onEdit: ReturnType<typeof vi.fn> } => {
  const { items, onEdit } = buildItems();

  render(
    <>
      <KebabMenu items={items} />
      <button type="button">After</button>
    </>
  );

  return { onEdit };
};

const trigger = (): HTMLElement => screen.getByRole('button', { name: 'More actions' });
const item = (name: string): HTMLElement => screen.getByRole('menuitem', { name });
const focused = (): Element | null => document.activeElement;
const press = (key: string): void => {
  fireEvent.keyDown(focused() ?? document.body, { key });
};

describe('KebabMenu', () => {
  it('opens on click with focus on the first item', () => {
    renderMenu();

    fireEvent.click(trigger());

    expect(trigger().getAttribute('aria-expanded')).toBe('true');
    expect(focused()).toBe(item('Edit'));
    expect(item('Edit').tabIndex).toBe(0);
    expect(item('Delete').tabIndex).toBe(-1);
  });

  it('opens on ArrowUp with focus on the last item', () => {
    renderMenu();
    trigger().focus();

    press('ArrowUp');

    expect(focused()).toBe(item('Delete'));
  });

  it('moves with the arrows, skipping disabled items and wrapping, and jumps with Home and End', () => {
    renderMenu();
    fireEvent.click(trigger());

    press('ArrowDown');
    expect(focused()).toBe(item('Move down'));

    press('ArrowDown');
    press('ArrowDown');
    expect(focused()).toBe(item('Edit'));

    press('ArrowUp');
    expect(focused()).toBe(item('Delete'));

    press('Home');
    expect(focused()).toBe(item('Edit'));

    press('End');
    expect(focused()).toBe(item('Delete'));
  });

  it('activates the focused item on Enter, closing and returning focus to the trigger', () => {
    const { onEdit } = renderMenu();
    fireEvent.click(trigger());

    press('Enter');

    expect(onEdit).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('menu')).toBeNull();
    expect(focused()).toBe(trigger());
  });

  it('ignores a click on a disabled item', () => {
    renderMenu();
    fireEvent.click(trigger());

    fireEvent.click(item('Move up'));

    expect(screen.getByRole('menu')).toBeTruthy();
  });

  it('closes on Escape and returns focus to the trigger', () => {
    renderMenu();
    fireEvent.click(trigger());

    press('Escape');

    expect(screen.queryByRole('menu')).toBeNull();
    expect(focused()).toBe(trigger());
  });

  it('closes on Tab from the trigger, so the browser moves focus on from there', () => {
    renderMenu();
    fireEvent.click(trigger());

    press('Tab');

    expect(screen.queryByRole('menu')).toBeNull();
    expect(focused()).toBe(trigger());
  });

  it('closes on a click outside', () => {
    renderMenu();
    fireEvent.click(trigger());

    fireEvent.mouseDown(screen.getByRole('button', { name: 'After' }));

    expect(screen.queryByRole('menu')).toBeNull();
  });

  it('keeps a click on the trigger or an item from reaching a clickable row', () => {
    const onRowClick = vi.fn();
    const { items } = buildItems();

    render(
      <div onClick={onRowClick}>
        <KebabMenu items={items} />
      </div>
    );

    fireEvent.click(trigger());
    fireEvent.click(item('Edit'));

    expect(onRowClick).not.toHaveBeenCalled();
  });

  it('closes only itself on Escape inside a modal', () => {
    const onCloseModal = vi.fn();
    const { items } = buildItems();

    render(
      <Modal isOpen onClose={onCloseModal} title="Session">
        <KebabMenu items={items} />
      </Modal>
    );

    fireEvent.click(trigger());
    press('Escape');

    expect(screen.queryByRole('menu')).toBeNull();
    expect(onCloseModal).not.toHaveBeenCalled();
  });
});
