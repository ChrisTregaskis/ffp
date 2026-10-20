import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { useForm } from 'react-hook-form';
import { describe, expect, it } from 'vitest';

import { Textarea } from './Textarea';

import type { UseFormReturn } from 'react-hook-form';

interface Values {
  notes: string;
}

let form: UseFormReturn<Values> | undefined;

const Harness: React.FC = () => {
  const methods = useForm<Values>({ defaultValues: { notes: 'Warm up first' } });
  const { ref, ...field } = methods.register('notes');
  form = methods;

  return <Textarea aria-label="Notes" {...field} forwardedRef={ref} />;
};

const textarea = (): HTMLTextAreaElement => screen.getByRole('textbox', { name: 'Notes' });

describe('Textarea', () => {
  it('carries the registered value, change, blur and ref', async () => {
    render(<Harness />);
    expect(textarea().value).toBe('Warm up first');

    fireEvent.change(textarea(), { target: { value: 'Keep core engaged' } });
    fireEvent.blur(textarea());

    await waitFor(() => {
      expect(form?.getValues('notes')).toBe('Keep core engaged');
    });
    expect(form?.getFieldState('notes').isTouched).toBe(true);

    act(() => {
      form?.setFocus('notes');
    });
    expect(document.activeElement).toBe(textarea());
  });
});
