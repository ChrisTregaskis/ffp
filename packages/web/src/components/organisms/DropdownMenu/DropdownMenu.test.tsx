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
            renderContent={() => <input type="checkbox" aria-label="Status" />}
          />
          <button type="button">After</button>
        </>
      );
    };

    it('closes on Escape from inside the popover and returns focus to the trigger', () => {
      renderPopover();
      fireEvent.click(trigger());

      const checkbox = screen.getByRole('checkbox', { name: 'Status' });
      checkbox.focus();
      fireEvent.keyDown(checkbox, { key: 'Escape' });

      expect(screen.queryByRole('dialog')).toBeNull();
      expect(document.activeElement).toBe(trigger());
    });

    it('stays open for a click inside and closes on a click outside', () => {
      renderPopover();
      fireEvent.click(trigger());

      fireEvent.mouseDown(screen.getByRole('checkbox', { name: 'Status' }));
      expect(screen.getByRole('dialog')).toBeTruthy();

      fireEvent.mouseDown(screen.getByRole('button', { name: 'After' }));
      expect(screen.queryByRole('dialog')).toBeNull();
    });
  });
});
