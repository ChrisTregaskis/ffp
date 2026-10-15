import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';

import { DropdownMenu } from './DropdownMenu';

const trigger = (): HTMLElement => screen.getByRole('button', { name: 'Columns' });

describe('DropdownMenu', () => {
  it('runs an item picked from its portalled menu rather than treating the press as outside', () => {
    const onEdit = vi.fn();
    render(<DropdownMenu label="Actions" items={[{ label: 'Edit', onClick: onEdit }]} />);

    fireEvent.click(screen.getByRole('button', { name: 'Actions' }));
    const edit = screen.getByRole('menuitem', { name: 'Edit' });
    fireEvent.mouseDown(edit);
    fireEvent.click(edit);

    expect(onEdit).toHaveBeenCalledTimes(1);
  });

  describe('with custom content', () => {
    const renderPopover = (): void => {
      render(
        <>
          <DropdownMenu
            label="Columns"
            renderContent={() => (
              <>
                <input type="checkbox" aria-label="Status" />
                <input type="checkbox" aria-label="Created" />
              </>
            )}
          />
          <button type="button">After</button>
        </>
      );
    };

    const checkbox = (name: string): HTMLElement => screen.getByRole('checkbox', { name });

    it('moves focus to its first control as it opens', () => {
      renderPopover();
      fireEvent.click(trigger());

      expect(screen.getByRole('dialog')).toBeTruthy();
      expect(document.activeElement).toBe(checkbox('Status'));
    });

    it('closes and returns focus to the trigger when Tab leaves either end', () => {
      renderPopover();
      fireEvent.click(trigger());

      checkbox('Status').focus();
      fireEvent.keyDown(checkbox('Status'), { key: 'Tab' });
      expect(screen.getByRole('dialog')).toBeTruthy();

      checkbox('Created').focus();
      fireEvent.keyDown(checkbox('Created'), { key: 'Tab' });
      expect(screen.queryByRole('dialog')).toBeNull();
      expect(document.activeElement).toBe(trigger());

      fireEvent.click(trigger());
      fireEvent.keyDown(checkbox('Status'), { key: 'Tab', shiftKey: true });
      expect(screen.queryByRole('dialog')).toBeNull();
      expect(document.activeElement).toBe(trigger());
    });

    it('closes to the trigger on Shift+Tab from the panel itself', () => {
      renderPopover();
      fireEvent.click(trigger());

      const panel = screen.getByRole('dialog');
      panel.focus();
      fireEvent.keyDown(panel, { key: 'Tab', shiftKey: true });

      expect(screen.queryByRole('dialog')).toBeNull();
      expect(document.activeElement).toBe(trigger());
    });

    it('returns focus held inside to the trigger when a click outside closes it', () => {
      renderPopover();
      fireEvent.click(trigger());

      fireEvent.mouseDown(document.body);

      expect(screen.queryByRole('dialog')).toBeNull();
      expect(document.activeElement).toBe(trigger());
    });

    it('closes on Escape from inside the popover and returns focus to the trigger', () => {
      renderPopover();
      fireEvent.click(trigger());

      fireEvent.keyDown(checkbox('Status'), { key: 'Escape' });

      expect(screen.queryByRole('dialog')).toBeNull();
      expect(document.activeElement).toBe(trigger());
    });

    it('stays open for a click inside and closes on a click outside', () => {
      renderPopover();
      fireEvent.click(trigger());

      fireEvent.mouseDown(checkbox('Status'));
      expect(screen.getByRole('dialog')).toBeTruthy();

      fireEvent.mouseDown(screen.getByRole('button', { name: 'After' }));
      expect(screen.queryByRole('dialog')).toBeNull();
    });
  });
});
