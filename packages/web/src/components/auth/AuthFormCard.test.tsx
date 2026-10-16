import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { AuthFormCard } from './AuthFormCard';

describe('AuthFormCard', () => {
  it('shows no alert without an error', () => {
    render(
      <AuthFormCard title="Welcome back" subtitle="Sign in.">
        <span>Fields</span>
      </AuthFormCard>
    );

    expect(screen.queryByRole('alert')).toBeNull();
    expect(screen.getByRole('heading', { name: 'Welcome back' })).toBeTruthy();
    expect(screen.getByText('Fields')).toBeTruthy();
  });

  it('shows the error and dismisses it', () => {
    const onDismissError = vi.fn();
    render(
      <AuthFormCard
        title="Welcome back"
        subtitle="Sign in."
        error="Incorrect username or password."
        onDismissError={onDismissError}
      >
        <span>Fields</span>
      </AuthFormCard>
    );

    expect(screen.getByRole('alert').textContent).toContain('Incorrect username or password.');
    fireEvent.click(screen.getByRole('button', { name: /dismiss/i }));
    expect(onDismissError).toHaveBeenCalledTimes(1);
  });
});
