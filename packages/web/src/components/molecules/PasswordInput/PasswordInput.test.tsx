import { fireEvent, render, screen } from '@testing-library/react';
import React, { useState } from 'react';
import { describe, expect, it } from 'vitest';

import { PasswordStrength } from '@web/utils/passwordStrength';

import { PasswordInput } from './PasswordInput';

const Harness: React.FC<{ hasError?: boolean }> = ({ hasError = false }) => {
  const [value, setValue] = useState('');

  return (
    <PasswordInput
      label="Confirm password"
      name="confirmPassword"
      value={value}
      onChange={setValue}
      hasError={hasError}
      errorMessage="Passwords do not match"
      strength={PasswordStrength.STRONG}
      showStrength
    />
  );
};

const field = (): HTMLInputElement => screen.getByLabelText('Confirm password');

describe('PasswordInput', () => {
  it('announces its error and ties it to the input', () => {
    render(<Harness hasError />);
    const alert = screen.getByRole('alert');

    expect(alert.textContent).toBe('Passwords do not match');
    expect(field().getAttribute('aria-invalid')).toBe('true');
    expect(field().getAttribute('aria-describedby')).toBe(alert.id);
  });

  it('describes nothing while valid', () => {
    render(<Harness />);

    expect(screen.queryByRole('alert')).toBeNull();
    expect(field().getAttribute('aria-invalid')).toBe('false');
    expect(field().getAttribute('aria-describedby')).toBeNull();
  });

  it('shows and hides the characters, keeping the typed value', () => {
    render(<Harness />);
    fireEvent.change(field(), { target: { value: 'S3cure!pass' } });

    expect(field().type).toBe('password');
    fireEvent.click(screen.getByRole('button', { name: 'Show password' }));
    expect(field().type).toBe('text');
    expect(field().value).toBe('S3cure!pass');
    fireEvent.click(screen.getByRole('button', { name: 'Hide password' }));
    expect(field().type).toBe('password');
  });
});
