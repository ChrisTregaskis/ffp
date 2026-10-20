import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { AuthContextType } from '@web/contexts/auth/auth.definitions';

import { ProtectedRoute } from './ProtectedRoute';

const { useAuth } = vi.hoisted(() => ({ useAuth: vi.fn<() => Partial<AuthContextType>>() }));

vi.mock('@web/hooks/useAuth', () => ({ useAuth }));

const renderAt = (path: string): void => {
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/login" element={<div>Sign-in page</div>} />
        <Route element={<ProtectedRoute excludeLayout />}>
          <Route path="/programme" element={<div>Programme content</div>} />
        </Route>
      </Routes>
    </MemoryRouter>
  );
};

describe('ProtectedRoute', () => {
  const checkAuth = vi.fn();

  beforeEach(() => {
    checkAuth.mockReset();
  });

  it('redirects to sign in when signed out', () => {
    useAuth.mockReturnValue({ user: null, loading: false, authUnavailable: false, checkAuth });

    renderAt('/programme');

    expect(screen.getByText('Sign-in page')).toBeTruthy();
  });

  it('shows the retry state instead of redirecting when the sign-in service is unreachable', async () => {
    useAuth.mockReturnValue({ user: null, loading: false, authUnavailable: true, checkAuth });

    renderAt('/programme');

    expect(screen.queryByText('Sign-in page')).toBeNull();
    expect(screen.getByText("Can't reach the sign-in service")).toBeTruthy();

    await userEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(checkAuth).toHaveBeenCalledTimes(1);
  });
});
