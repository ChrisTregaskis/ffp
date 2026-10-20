import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React, { useState } from 'react';
import { describe, expect, it } from 'vitest';

import { SlideOver } from './SlideOver';

const Harness: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setIsOpen(true);
        }}
      >
        Open help
      </button>
      <SlideOver
        isOpen={isOpen}
        onClose={() => {
          setIsOpen(false);
        }}
        title="How it works"
      >
        <button type="button">Inside</button>
      </SlideOver>
    </>
  );
};

describe('SlideOver', () => {
  it('opens as a dialog that takes focus and locks the page scroll', async () => {
    render(<Harness />);

    fireEvent.click(screen.getByText('Open help'));

    const dialog = await screen.findByRole('dialog', { name: 'How it works' });

    await waitFor(() => {
      expect(document.activeElement).toBe(dialog);
    });
    expect(document.body.style.overflow).toBe('hidden');
  });

  it('closes on Escape and hands focus back to the trigger', async () => {
    render(<Harness />);

    const trigger = screen.getByText('Open help');
    trigger.focus();
    fireEvent.click(trigger);
    await screen.findByRole('dialog');

    fireEvent.keyDown(document, { key: 'Escape' });

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).toBeNull();
    });
    expect(document.activeElement).toBe(trigger);
    expect(document.body.style.overflow).toBe('');
  });

  it('closes from its close button', async () => {
    render(<Harness />);

    fireEvent.click(screen.getByText('Open help'));
    fireEvent.click(await screen.findByLabelText('Close panel'));

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).toBeNull();
    });
  });
});
