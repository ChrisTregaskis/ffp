import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { useForm } from 'react-hook-form';
import { describe, expect, it, vi } from 'vitest';

import { FormEmailInput } from './FormEmailInput';

interface Values {
  email: string;
}

const Harness: React.FC<{ onSubmit: (values: Values) => void; requiredMessage?: string }> = ({
  onSubmit,
  requiredMessage,
}) => {
  const { register, handleSubmit, formState } = useForm<Values>({ defaultValues: { email: '' } });

  return (
    <form onSubmit={(event) => void handleSubmit(onSubmit)(event)}>
      <FormEmailInput
        name="email"
        label="Email"
        register={register}
        errors={formState.errors}
        requiredMessage={requiredMessage}
        autoComplete="username"
      />
      <button type="submit">Save</button>
    </form>
  );
};

const typeAndSave = (value: string): void => {
  fireEvent.change(screen.getByRole('textbox'), { target: { value } });
  fireEvent.click(screen.getByRole('button', { name: 'Save' }));
};

describe('FormEmailInput', () => {
  it('is a text input with the email keyboard and the autocomplete hint', () => {
    render(<Harness onSubmit={vi.fn()} />);
    const input = screen.getByRole('textbox');

    expect(input.getAttribute('type')).toBe('text');
    expect(input.getAttribute('inputmode')).toBe('email');
    expect(input.getAttribute('autocomplete')).toBe('username');
  });

  it('shows the required message when empty and required', async () => {
    render(<Harness onSubmit={vi.fn()} requiredMessage="Please give an email address" />);
    typeAndSave('');

    expect(await screen.findByText('Please give an email address')).toBeTruthy();
  });

  it('submits empty when not required', async () => {
    const onSubmit = vi.fn();
    render(<Harness onSubmit={onSubmit} />);
    typeAndSave('');

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({ email: '' }, expect.anything());
    });
  });

  it('rejects a malformed address with the pattern message', async () => {
    const onSubmit = vi.fn();
    render(<Harness onSubmit={onSubmit} requiredMessage="Required" />);
    typeAndSave('not-an-email');

    expect(await screen.findByText('Please enter a valid email address')).toBeTruthy();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('submits the address trimmed', async () => {
    const onSubmit = vi.fn();
    render(<Harness onSubmit={onSubmit} requiredMessage="Required" />);
    typeAndSave('  someone@example.com ');

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({ email: 'someone@example.com' }, expect.anything());
    });
  });
});
