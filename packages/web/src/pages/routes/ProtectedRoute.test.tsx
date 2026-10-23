import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { AuthContextType, AuthUser } from '@web/contexts/auth/auth.definitions';
import type * as Rbac from '@web/lib/rbac';

import { ProtectedRoute } from './ProtectedRoute';

const { useAuth, logUnauthorisedAccess } = vi.hoisted(() => ({
  useAuth: vi.fn<() => Partial<AuthContextType>>(),
  logUnauthorisedAccess: vi.fn(),
}));

vi.mock('@web/hooks/useAuth', () => ({ useAuth }));
vi.mock('@web/lib/rbac', async (importOriginal) => ({
  ...(await importOriginal<typeof Rbac>()),
  logUnauthorisedAccess,
}));

const renderAt = (path: string): void => {
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/login" element={<div>Sign-in page</div>} />
        <Route path="/unauthorized" element={<div>Unauthorised page</div>} />
        <Route element={<ProtectedRoute excludeLayout />}>
          <Route path="/programme" element={<div>Programme content</div>} />
          <Route path="/admin/questions/:publicId" element={<div>Question editor</div>} />
        </Route>
      </Routes>
    </MemoryRouter>
  );
};

describe('ProtectedRoute', () => {
  const checkAuth = vi.fn();

  beforeEach(() => {
    checkAuth.mockReset();
    logUnauthorisedAccess.mockReset();
  });

  const signedInAs = (role: AuthUser['role']): void => {
    useAuth.mockReturnValue({
      user: { userId: 'cognito-sub-1', email: 'member@example.com', organisationId: 'org-1', role },
      loading: false,
      authUnavailable: false,
      checkAuth,
    });
  };

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

  it('refuses a signed-in programme_user on a parameterised admin route and logs the attempt', () => {
    signedInAs('programme_user');

    renderAt('/admin/questions/q1a2b3c4d5e6');

    expect(screen.getByText('Unauthorised page')).toBeTruthy();
    expect(screen.queryByText('Question editor')).toBeNull();
    expect(logUnauthorisedAccess).toHaveBeenCalledWith(
      'cognito-sub-1',
      '/admin/questions/q1a2b3c4d5e6',
      'programme_user'
    );
  });

  it('admits a system_admin to the same parameterised admin route', () => {
    signedInAs('system_admin');

    renderAt('/admin/questions/q1a2b3c4d5e6');

    expect(screen.getByText('Question editor')).toBeTruthy();
    expect(logUnauthorisedAccess).not.toHaveBeenCalled();
  });
});
