import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { ForgotPasswordRequestForm } from './ForgotPasswordRequestForm';

const renderForm = (): ReturnType<typeof vi.fn> => {
  const onSubmit = vi.fn().mockResolvedValue(undefined);
  render(
    <ForgotPasswordRequestForm
      onSubmit={onSubmit}
      isLoading={false}
      error={null}
      onClearError={vi.fn()}
      onBackToLogin={vi.fn()}
    />
  );

  return onSubmit;
};

const email = (): HTMLElement => screen.getByRole('textbox', { name: 'Email (required)' });
const submit = (): void => {
  fireEvent.click(screen.getByRole('button', { name: 'Send verification code' }));
};

describe('ForgotPasswordRequestForm', () => {
  it('asks for an email when submitted empty, and sends nothing', async () => {
    const onSubmit = renderForm();
    submit();

    expect((await screen.findByRole('alert')).textContent).toBe('Please enter your email address');
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('sends a valid email', async () => {
    const onSubmit = renderForm();
    fireEvent.change(email(), { target: { value: 'someone@example.com' } });
    submit();

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({ email: 'someone@example.com' }, expect.anything());
    });
  });
});
