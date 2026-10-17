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

  it('refuses a malformed email', async () => {
    const onSubmit = renderForm();
    fireEvent.change(email(), { target: { value: 'not-an-email' } });
    fireEvent.change(password(), { target: { value: 'secret' } });
    submit();

    expect(await alerts()).toEqual(['Please enter a valid email address']);
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('trims the email before checking and sending it', async () => {
    const onSubmit = renderForm();
    fireEvent.change(email(), { target: { value: ' member@example.com ' } });
    fireEvent.change(password(), { target: { value: 'secret' } });
    submit();

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({ email: 'member@example.com', password: 'secret' });
    });
  });
});
