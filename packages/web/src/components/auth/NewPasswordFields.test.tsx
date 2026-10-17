import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { useNewPasswordFields } from '@web/hooks/useNewPasswordFields';

import { NewPasswordFields } from './NewPasswordFields';

const Harness: React.FC<{ isLoading?: boolean }> = ({ isLoading = false }) => {
  const newPassword = useNewPasswordFields();

  return (
    <form>
      <NewPasswordFields newPassword={newPassword} isLoading={isLoading} submitLabel="Save" />
    </form>
  );
};

const save = (): HTMLButtonElement => screen.getByRole('button', { name: 'Save' });

describe('NewPasswordFields', () => {
  it('enables the submit only for a strong, matching pair', () => {
    render(<Harness />);
    expect(save().disabled).toBe(true);

    fireEvent.change(screen.getByLabelText('New password'), {
      target: { value: 'Calm-Harbour-42' },
    });
    expect(screen.getByTestId('password-strength-indicator')).toBeTruthy();
    expect(save().disabled).toBe(true);

    fireEvent.change(screen.getByLabelText('Confirm password'), {
      target: { value: 'Calm-Harbour-42' },
    });
    expect(save().disabled).toBe(false);
  });

  it('disables everything while loading', () => {
    render(<Harness isLoading />);

    expect(screen.getByLabelText<HTMLInputElement>('New password').disabled).toBe(true);
    expect(save().disabled).toBe(true);
  });
});
