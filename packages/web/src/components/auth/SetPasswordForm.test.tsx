import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { signIn, confirmSignIn } from 'aws-amplify/auth';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { SetPasswordForm } from './SetPasswordForm';

vi.mock('aws-amplify/auth', () => ({ signIn: vi.fn(), confirmSignIn: vi.fn() }));

const STRONG = 'Calm-Harbour-42';

const email = (): HTMLElement => screen.getByRole('textbox', { name: 'Email (required)' });
const newPassword = (): HTMLElement => screen.getByLabelText('New password');
const confirmPassword = (): HTMLElement => screen.getByLabelText('Confirm password');
const setPasswordButton = (): HTMLButtonElement =>
  screen.getByRole('button', { name: 'Set password' });

describe('SetPasswordForm', () => {
  beforeEach(() => {
    vi.mocked(signIn).mockReset();
    vi.mocked(confirmSignIn).mockReset();
  });

  describe('credentials step', () => {
    it('asks for both fields when submitted empty, and sends nothing', async () => {
      render(<SetPasswordForm onSuccess={vi.fn()} />);
      fireEvent.click(screen.getByRole('button', { name: 'Continue' }));

      const alerts = (await screen.findAllByRole('alert')).map((alert) => alert.textContent);
      expect(alerts).toEqual([
        'Please enter your email address',
        'Please enter your temporary password',
      ]);
      expect(signIn).not.toHaveBeenCalled();
    });

    it('refuses a malformed email', async () => {
      render(<SetPasswordForm onSuccess={vi.fn()} initialEmail="invited" />);
      fireEvent.change(screen.getByLabelText(/^Temporary password/), {
        target: { value: 'Temp-123' },
      });
      fireEvent.click(screen.getByRole('button', { name: 'Continue' }));

      expect((await screen.findByRole('alert')).textContent).toBe(
        'Please enter a valid email address'
      );
      expect(signIn).not.toHaveBeenCalled();
    });

    it('moves to the new password step when Cognito asks for one', async () => {
      vi.mocked(signIn).mockResolvedValue({
        isSignedIn: false,
        nextStep: { signInStep: 'CONFIRM_SIGN_IN_WITH_NEW_PASSWORD_REQUIRED' },
      } as Awaited<ReturnType<typeof signIn>>);
      render(<SetPasswordForm onSuccess={vi.fn()} />);
      fireEvent.change(email(), { target: { value: 'invited@example.com' } });
      fireEvent.change(screen.getByLabelText(/^Temporary password/), {
        target: { value: 'Temp-123' },
      });
      fireEvent.click(screen.getByRole('button', { name: 'Continue' }));

      expect(
        await screen.findByText('Set a secure password for invited@example.com.')
      ).toBeTruthy();
      expect(signIn).toHaveBeenCalledWith({
        username: 'invited@example.com',
        password: 'Temp-123',
      });
      expect(screen.getByRole('button', { name: 'Go back' })).toBeTruthy();
    });
  });

  it('dismisses its own error even when the page passes onClearError', async () => {
    vi.mocked(signIn).mockRejectedValue(new Error('Incorrect username or password.'));
    const onClearError = vi.fn();
    render(
      <SetPasswordForm
        onSuccess={vi.fn()}
        initialEmail="invited@example.com"
        error={null}
        onClearError={onClearError}
      />
    );
    fireEvent.change(screen.getByLabelText(/^Temporary password/), {
      target: { value: 'Temp-123' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));

    const alert = await screen.findByRole('alert');
    expect(alert.textContent).toContain('Incorrect username or password.');

    fireEvent.click(screen.getByRole('button', { name: /dismiss/i }));

    await waitFor(() => {
      expect(screen.queryByRole('alert')).toBeNull();
    });
    expect(onClearError).toHaveBeenCalled();
  });

  describe('new password step', () => {
    const renderStep = (): void => {
      render(
        <SetPasswordForm
          onSuccess={vi.fn()}
          initialEmail="invited@example.com"
          skipTempPasswordStep
        />
      );
    };

    it('keeps the submit disabled and sends nothing while the entries differ', async () => {
      renderStep();
      fireEvent.change(newPassword(), { target: { value: STRONG } });
      fireEvent.change(confirmPassword(), { target: { value: 'Calm-Harbour-43' } });

      expect(setPasswordButton().disabled).toBe(true);
      expect(screen.getByRole('alert').textContent).toBe('Passwords do not match');

      const form = setPasswordButton().form;
      expect(form).not.toBeNull();
      fireEvent.submit(form ?? document.body);

      await waitFor(() => {
        expect(screen.getAllByRole('alert')).toHaveLength(2);
      });
      expect(confirmSignIn).not.toHaveBeenCalled();
    });

    it('sets the password once every requirement is met and both entries match', async () => {
      vi.mocked(confirmSignIn).mockResolvedValue({
        isSignedIn: true,
        nextStep: { signInStep: 'DONE' },
      } as Awaited<ReturnType<typeof confirmSignIn>>);
      const onSuccess = vi.fn().mockResolvedValue(undefined);
      render(
        <SetPasswordForm
          onSuccess={onSuccess}
          initialEmail="invited@example.com"
          skipTempPasswordStep
        />
      );
      fireEvent.change(newPassword(), { target: { value: STRONG } });
      fireEvent.change(confirmPassword(), { target: { value: STRONG } });
      fireEvent.click(setPasswordButton());

      await waitFor(() => {
        expect(onSuccess).toHaveBeenCalledTimes(1);
      });
      expect(confirmSignIn).toHaveBeenCalledWith({ challengeResponse: STRONG });
      expect(screen.queryByRole('button', { name: 'Go back' })).toBeNull();
    });
  });
});
