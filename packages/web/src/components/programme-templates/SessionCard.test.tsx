import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import type { TemplatePhaseWithSessions } from '@ffp/core';

import { ToastProvider } from '@web/contexts/toast/ToastContext';

import { SessionCard } from './SessionCard';

const SESSION: TemplatePhaseWithSessions['sessions'][number] = {
  id: '99999999-9999-9999-8999-999999990001',
  sessionNumber: 1,
  name: 'Morning Mobility',
  description: 'A gentle start to loosen the hips.',
  estimatedDurationMinutes: 20,
  exercises: [],
};

const renderCard = (onUpdate: () => Promise<void>): void => {
  render(
    <QueryClientProvider client={new QueryClient()}>
      <ToastProvider>
        <SessionCard
          session={SESSION}
          templateId="bbbbbbbbbbbb"
          isFirst
          isLast
          onUpdate={onUpdate}
          onDelete={vi.fn()}
          onMoveUp={vi.fn()}
          onMoveDown={vi.fn()}
        />
      </ToastProvider>
    </QueryClientProvider>
  );
};

const nameInput = (): HTMLInputElement =>
  screen.getByRole<HTMLInputElement>('textbox', { name: /Session Name/ });

const editAndSave = async (name: string): Promise<void> => {
  fireEvent.click(screen.getByRole('button', { name: 'More actions' }));
  fireEvent.click(await screen.findByRole('menuitem', { name: 'Edit' }));

  fireEvent.change(nameInput(), { target: { value: name } });
  fireEvent.click(screen.getByRole('button', { name: 'Save' }));
};

describe('SessionCard editing', () => {
  it('seeds the stored description and leaves it out of a name-only save', async () => {
    const onUpdate = vi.fn(() => Promise.resolve());
    renderCard(onUpdate);

    await editAndSave('Evening Mobility');

    await waitFor(() => {
      expect(onUpdate).toHaveBeenCalledWith(SESSION.id, { name: 'Evening Mobility' });
    });
    await waitFor(() => {
      expect(screen.queryByText('Edit Session')).toBeNull();
    });
  });

  it('keeps the form open with the edits when the save fails', async () => {
    const onUpdate = vi.fn(() => Promise.reject(new Error('Network error')));
    renderCard(onUpdate);

    await editAndSave('Evening Mobility');

    await waitFor(() => {
      expect(onUpdate).toHaveBeenCalled();
    });
    expect(screen.getByText('Edit Session')).toBeTruthy();
    expect(nameInput().value).toBe('Evening Mobility');
  });
});
