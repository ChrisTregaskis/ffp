import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React, { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { Modal } from './Modal';

interface HarnessProps {
  onClose?: () => void;
}

// A trigger that opens a modal holding two buttons, as a confirm does
const Harness: React.FC<HarnessProps> = ({ onClose }) => {
  const [isOpen, setIsOpen] = useState(false);
  const close = (): void => {
    onClose?.();
    setIsOpen(false);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setIsOpen(true);
        }}
      >
        Open
      </button>
      <Modal isOpen={isOpen} onClose={close} title="Confirm">
        <button type="button" onClick={close}>
          Cancel
        </button>
        <button type="button">Confirm</button>
      </Modal>
    </>
  );
};

// A modal removed from the tree while still open, as a page unmounting under it does
const UnmountHarness: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(true);

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setIsOpen(true);
        }}
      >
        Open
      </button>
      {isMounted && (
        <Modal isOpen={isOpen} onClose={vi.fn()} title="Confirm">
          <button
            type="button"
            onClick={() => {
              setIsMounted(false);
            }}
          >
            Remove
          </button>
        </Modal>
      )}
    </>
  );
};

const openModal = async (): Promise<HTMLElement> => {
  const opener = screen.getByRole('button', { name: 'Open' });
  opener.focus();
  fireEvent.click(opener);

  const dialog = screen.getByRole('dialog', { name: 'Confirm' });
  await waitFor(() => {
    expect(document.activeElement).toBe(dialog);
  });

  return opener;
};

const tab = (shiftKey = false): void => {
  fireEvent.keyDown(document.activeElement ?? document.body, { key: 'Tab', shiftKey });
};

describe('Modal', () => {
  it('keeps Tab and Shift+Tab within the dialog, wrapping at both ends', async () => {
    render(<Harness />);
    await openModal();

    // Shift+Tab from the dialog itself, where focus lands on open
    tab(true);
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Confirm' }));

    tab();
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Close modal' }));
  });

  it('closes on Escape and returns focus to the trigger', async () => {
    const onClose = vi.fn();
    render(<Harness onClose={onClose} />);
    const opener = await openModal();

    fireEvent.keyDown(window, { key: 'Escape' });

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(document.activeElement).toBe(opener);
  });

  it('restores focus and page scroll when unmounted while open', async () => {
    render(<UnmountHarness />);
    const opener = await openModal();
    expect(document.body.style.overflow).toBe('hidden');

    fireEvent.click(screen.getByRole('button', { name: 'Remove' }));

    expect(screen.queryByRole('dialog')).toBeNull();
    expect(document.body.style.overflow).toBe('');
    expect(document.activeElement).toBe(opener);
  });

  it('keeps the page locked while a second modal closes over an open one', () => {
    const { rerender } = render(
      <>
        <Modal isOpen onClose={vi.fn()} title="First">
          First
        </Modal>
        <Modal isOpen onClose={vi.fn()} title="Second">
          Second
        </Modal>
      </>
    );

    rerender(
      <>
        <Modal isOpen onClose={vi.fn()} title="First">
          First
        </Modal>
        <Modal isOpen={false} onClose={vi.fn()} title="Second">
          Second
        </Modal>
      </>
    );

    expect(document.body.style.overflow).toBe('hidden');
  });
});
