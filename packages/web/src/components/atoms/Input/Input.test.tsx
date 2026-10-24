import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { useForm } from 'react-hook-form';
import { describe, expect, it, vi } from 'vitest';

import { Input } from './Input';

import type { UseFormReturn } from 'react-hook-form';

interface Values {
  name: string;
}

const Harness: React.FC<{
  onReady: (form: UseFormReturn<Values>) => void;
  onSubmit: (values: Values) => void;
}> = ({ onReady, onSubmit }) => {
  const form = useForm<Values>({ defaultValues: { name: 'Ada' } });
  const { ref, ...field } = form.register('name');
  onReady(form);

  return (
    <form onSubmit={(event) => void form.handleSubmit(onSubmit)(event)}>
      <Input aria-label="Name" {...field} forwardedRef={ref} />
      <button type="submit">Save</button>
    </form>
  );
};

const renderInput = (): {
  form: () => UseFormReturn<Values>;
  onSubmit: ReturnType<typeof vi.fn>;
} => {
  let current: UseFormReturn<Values> | undefined;
  const onSubmit = vi.fn();
  render(
    <Harness
      onReady={(form) => {
        current = form;
      }}
      onSubmit={onSubmit}
    />
  );

  return {
    onSubmit,
    form: () => {
      if (!current) {
        throw new Error('form not ready');
      }

      return current;
    },
  };
};

const input = (): HTMLInputElement => screen.getByRole('textbox', { name: 'Name' });

describe('Input', () => {
  it('carries the registered value, change, blur and ref', async () => {
    const { form, onSubmit } = renderInput();
    expect(input().value).toBe('Ada');

    // Submitted before any blur, which would also carry the value and hide a lost change
    fireEvent.change(input(), { target: { value: 'Grace' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledTimes(1);
    });
    expect(onSubmit.mock.calls[0]?.[0]).toEqual({ name: 'Grace' });

    fireEvent.blur(input());
    await waitFor(() => {
      expect(form().getFieldState('name').isTouched).toBe(true);
    });

    act(() => {
      form().setFocus('name');
    });
    expect(document.activeElement).toBe(input());
  });

  it('adds the locked look when read-only and none of the field chrome when bare', () => {
    const { rerender } = render(<Input aria-label="Code" readOnly />);
    expect(screen.getByRole('textbox', { name: 'Code' }).className).toContain('cursor-not-allowed');

    rerender(<Input aria-label="Code" appearance="bare" className="border-0" />);
    expect(screen.getByRole('textbox', { name: 'Code' }).className).toBe('border-0');
  });
});
