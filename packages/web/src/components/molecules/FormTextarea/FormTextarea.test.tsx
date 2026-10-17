import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { useForm } from 'react-hook-form';
import { describe, expect, it } from 'vitest';

import { FormTextarea } from './FormTextarea';

interface Values {
  notes: string;
}

const Harness: React.FC = () => {
  const { register, handleSubmit, formState } = useForm<Values>({ defaultValues: { notes: '' } });
  // The molecule registers without rules, so the rule is added here first
  register('notes', { required: 'Notes are required' });

  return (
    <form onSubmit={(event) => void handleSubmit(() => undefined)(event)}>
      <FormTextarea
        name="notes"
        label="Notes"
        register={register}
        errors={formState.errors}
        isRequired
      />
      <button type="submit">Save</button>
    </form>
  );
};

describe('FormTextarea', () => {
  it('ties the announced error to the textarea', async () => {
    render(<Harness />);
    const notes = screen.getByRole('textbox', { name: 'Notes (required)' });

    expect(notes.getAttribute('aria-required')).toBe('true');
    expect(notes.getAttribute('aria-invalid')).toBe('false');
    expect(notes.getAttribute('aria-describedby')).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    const alert = await screen.findByRole('alert');

    expect(alert.textContent).toBe('Notes are required');
    expect(notes.getAttribute('aria-invalid')).toBe('true');
    expect(notes.getAttribute('aria-describedby')).toBe(alert.id);
  });
});
