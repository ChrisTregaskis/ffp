import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { useForm } from 'react-hook-form';
import { describe, expect, it } from 'vitest';

import { Label } from '../Label';

import { Checkbox } from './Checkbox';

import type { UseFormReturn } from 'react-hook-form';

interface Values {
  consent: boolean;
}

let form: UseFormReturn<Values> | undefined;

const Harness: React.FC = () => {
  const methods = useForm<Values>({ defaultValues: { consent: false } });
  const { ref, ...field } = methods.register('consent');
  form = methods;

  return (
    <Label variant="option" control={<Checkbox {...field} forwardedRef={ref} />}>
      I agree
    </Label>
  );
};

const checkbox = (): HTMLInputElement => screen.getByRole('checkbox', { name: 'I agree' });

describe('Checkbox', () => {
  it('is named by the label that wraps it and carries register through', async () => {
    render(<Harness />);
    expect(checkbox().checked).toBe(false);

    fireEvent.click(screen.getByText('I agree'));
    fireEvent.blur(checkbox());

    await waitFor(() => {
      expect(form?.getValues('consent')).toBe(true);
    });
    expect(form?.getFieldState('consent').isTouched).toBe(true);

    act(() => {
      form?.setFocus('consent');
    });
    expect(document.activeElement).toBe(checkbox());
  });
});
