import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { useForm } from 'react-hook-form';
import { describe, expect, it } from 'vitest';

import { Label } from '../Label';

import { Radio } from './Radio';

import type { UseFormReturn } from 'react-hook-form';

interface Values {
  pace: string;
}

let form: UseFormReturn<Values> | undefined;

const Harness: React.FC = () => {
  const methods = useForm<Values>({ defaultValues: { pace: 'gentle' } });
  const { ref, ...field } = methods.register('pace');
  form = methods;

  return (
    <>
      <Label variant="option" control={<Radio {...field} value="gentle" forwardedRef={ref} />}>
        Gentle
      </Label>
      <Label variant="option" control={<Radio {...field} value="brisk" forwardedRef={ref} />}>
        Brisk
      </Label>
    </>
  );
};

const radio = (name: string): HTMLInputElement => screen.getByRole('radio', { name });

describe('Radio', () => {
  it('is named by the label that wraps it, and its group shares one value', async () => {
    render(<Harness />);
    expect(radio('Gentle').checked).toBe(true);

    fireEvent.click(screen.getByText('Brisk'));

    await waitFor(() => {
      expect(form?.getValues('pace')).toBe('brisk');
    });
    expect(radio('Gentle').checked).toBe(false);

    act(() => {
      form?.setFocus('pace');
    });
    expect(document.activeElement).toBe(radio('Gentle'));
  });
});
