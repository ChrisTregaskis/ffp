import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { useForm } from 'react-hook-form';
import { describe, expect, it, vi } from 'vitest';

import { FormTagInput } from './FormTagInput';

interface Values {
  bodyParts: string[];
}

const Harness: React.FC<{ onSubmit: (values: Values) => void }> = ({ onSubmit }) => {
  const { control, handleSubmit, formState } = useForm<Values>({
    defaultValues: { bodyParts: [] },
  });

  return (
    <form onSubmit={(event) => void handleSubmit(onSubmit)(event)}>
      <FormTagInput
        name="bodyParts"
        label="Body Parts"
        control={control}
        errors={formState.errors}
        isRequired
        rules={{ required: 'Please add at least one body part' }}
      />
      <button type="submit">Save</button>
    </form>
  );
};

const save = (): void => {
  fireEvent.click(screen.getByRole('button', { name: 'Save' }));
};

describe('FormTagInput', () => {
  it('refuses an empty list when required', async () => {
    const onSubmit = vi.fn();
    render(<Harness onSubmit={onSubmit} />);
    save();

    expect((await screen.findByRole('alert')).textContent).toBe(
      'Please add at least one body part'
    );
    expect(screen.getByRole('textbox').getAttribute('aria-invalid')).toBe('true');
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('submits once a tag is added', async () => {
    const onSubmit = vi.fn();
    render(<Harness onSubmit={onSubmit} />);
    const input = screen.getByRole('textbox');

    fireEvent.change(input, { target: { value: 'Hamstrings' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    save();

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledTimes(1);
    });
    expect(onSubmit.mock.calls[0]?.[0]).toEqual({ bodyParts: ['hamstrings'] });
  });
});
