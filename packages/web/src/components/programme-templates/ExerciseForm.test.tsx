import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { ExerciseForm } from './ExerciseForm';

import type { ExerciseFormValues } from './exercise-utils';

const STORED: ExerciseFormValues = {
  videoId: '33333333-3333-3333-8333-333333330001',
  sets: '3',
  reps: '8-12',
  durationSeconds: '',
  restSeconds: '',
  notes: '',
};

const renderForm = (isEditMode: boolean): ReturnType<typeof vi.fn> => {
  const onSubmit = vi.fn();

  render(
    <QueryClientProvider client={new QueryClient()}>
      <ExerciseForm
        initialValues={STORED}
        initialSelectedVideo={{ publicId: 'aaaaaaaaaaaa', title: 'Wall squat' }}
        onSubmit={onSubmit}
        onCancel={vi.fn()}
        isEditMode={isEditMode}
      />
    </QueryClientProvider>
  );

  return onSubmit;
};

const blankRepsAndSave = (): void => {
  fireEvent.change(screen.getByRole('textbox', { name: /Reps/ }), { target: { value: '  ' } });
  fireEvent.click(screen.getByRole('button', { name: 'Save' }));
};

describe('ExerciseForm reps', () => {
  // Reps cannot be stored empty, so a blank would otherwise keep the old value unseen
  it('refuses a blank on edit', async () => {
    const onSubmit = renderForm(true);
    blankRepsAndSave();

    expect((await screen.findByRole('alert')).textContent).toBe('Please give the reps');
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('allows a blank on create, for the video defaults to fill', async () => {
    const onSubmit = renderForm(false);
    blankRepsAndSave();

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ reps: '' }));
    });
  });
});
