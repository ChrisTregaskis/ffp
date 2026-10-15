import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { useForm } from 'react-hook-form';
import { describe, expect, it, vi } from 'vitest';

import { FormTextInput } from './FormTextInput';

interface Values {
  title: string;
  sets: string;
}

const Harness: React.FC<{ onSubmit: (values: Values) => void }> = ({ onSubmit }) => {
  const { register, handleSubmit, formState } = useForm<Values>({
    defaultValues: { title: '', sets: '3' },
  });

  return (
    <form onSubmit={(event) => void handleSubmit(onSubmit)(event)}>
      <FormTextInput
        name="title"
        label="Title"
        hint="Shown to members"
        register={register}
        errors={formState.errors}
        isRequired
        registerOptions={{ required: 'Title is required' }}
      />
      <FormTextInput
        name="sets"
        label="Sets"
        type="number"
        register={register}
        errors={formState.errors}
        inputProps={{ min: 1 }}
      />
      <button type="submit">Save</button>
    </form>
  );
};

const save = (): void => {
  fireEvent.click(screen.getByRole('button', { name: 'Save' }));
};

describe('FormTextInput', () => {
  it('reads "(required)" in the name and describes the field by its hint', () => {
    render(<Harness onSubmit={vi.fn()} />);
    const title = screen.getByRole('textbox', { name: 'Title (required)' });

    expect(title.getAttribute('aria-required')).toBe('true');
    expect(title.getAttribute('aria-invalid')).toBe('false');
    expect(title.getAttribute('aria-describedby')).toBe('title-hint');
  });

  it('marks the field invalid and describes it by the announced error', async () => {
    render(<Harness onSubmit={vi.fn()} />);
    save();

    const alert = await screen.findByRole('alert');
    const title = screen.getByRole('textbox', { name: 'Title (required)' });

    expect(alert.textContent).toBe('Title is required');
    expect(title.getAttribute('aria-invalid')).toBe('true');
    expect(title.getAttribute('aria-describedby')).toBe('title-hint title-error');
    expect(alert.id).toBe('title-error');
  });

  it('keeps a number field as the string the admin forms convert themselves', async () => {
    const onSubmit = vi.fn();
    render(<Harness onSubmit={onSubmit} />);
    const sets = screen.getByRole('spinbutton', { name: 'Sets' });

    expect(sets.getAttribute('min')).toBe('1');
    fireEvent.change(screen.getByRole('textbox', { name: 'Title (required)' }), {
      target: { value: 'Squat' },
    });
    fireEvent.change(sets, { target: { value: '4' } });
    save();

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledTimes(1);
    });
    expect(onSubmit.mock.calls[0]?.[0]).toEqual({ title: 'Squat', sets: '4' });
  });
});
