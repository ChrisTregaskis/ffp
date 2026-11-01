import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

import { LoginForm } from './LoginForm';

const renderForm = (): ReturnType<typeof vi.fn> => {
  const onSubmit = vi.fn().mockResolvedValue(undefined);
  render(
    <MemoryRouter>
      <LoginForm onSubmit={onSubmit} />
    </MemoryRouter>
  );

  return onSubmit;
};

const email = (): HTMLElement => screen.getByRole('textbox', { name: 'Email (required)' });
const password = (): HTMLElement => screen.getByLabelText(/^Password/);
const submit = (): void => {
  fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));
};
const alerts = async (): Promise<(string | null)[]> =>
  (await screen.findAllByRole('alert')).map((alert) => alert.textContent);

describe('LoginForm', () => {
  it('asks for both fields when submitted empty, and sends nothing', async () => {
    const onSubmit = renderForm();
    submit();

    expect(await alerts()).toEqual([
      'Please enter your email address',
      'Please enter your password',
    ]);
    expect(email().getAttribute('aria-invalid')).toBe('true');
    expect(onSubmit).not.toHaveBeenCalled();
  });

  // The padding proves the email goes through the email field's own rules (FormEmailInput)
  it('sends the email, trimmed by its email field, and the password', async () => {
    const onSubmit = renderForm();
    fireEvent.change(email(), { target: { value: ' member@example.com ' } });
    fireEvent.change(password(), { target: { value: 'secret' } });
    submit();

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({ email: 'member@example.com', password: 'secret' });
    });
  });
});
