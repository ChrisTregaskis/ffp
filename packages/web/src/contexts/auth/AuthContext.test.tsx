import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useAuth } from '@web/hooks/useAuth';

import { AuthProvider } from './AuthContext';

import type { AuthContextType } from './auth.definitions';
import type { ReactNode } from 'react';

const { getCurrentUser, fetchAuthSession, signOut } = vi.hoisted(() => ({
  getCurrentUser: vi.fn(),
  fetchAuthSession: vi.fn(),
  signOut: vi.fn(),
}));

vi.mock('aws-amplify/auth', () => ({
  getCurrentUser,
  fetchAuthSession,
  signIn: vi.fn(),
  signOut,
}));

const CLAIMS = {
  sub: 'user-sub',
  email: 'member@example.com',
  'custom:tenantId': '0b6f3c1e-4a2d-4f8e-9c1a-2d3e4f5a6b7c',
  'custom:role': 'programme_user',
};

const namedError = (name: string): Error => Object.assign(new Error(name), { name });

const wrapper = ({ children }: { children: ReactNode }): JSX.Element => (
  <AuthProvider>{children}</AuthProvider>
);

/** Mounts the provider and lets the mount-time check, including any retry waits, finish. */
const renderAuth = async (): Promise<{ current: AuthContextType }> => {
  const { result } = renderHook(() => useAuth(), { wrapper });
  await act(async () => {
    await vi.runAllTimersAsync();
  });

  return result;
};

describe('AuthProvider checkAuth', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    getCurrentUser.mockReset().mockResolvedValue({ userId: CLAIMS.sub });
    fetchAuthSession.mockReset().mockResolvedValue({ tokens: { idToken: { payload: CLAIMS } } });
    signOut.mockReset().mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('sets the user from a valid session', async () => {
    const result = await renderAuth();

    expect(result.current.user).toEqual({
      userId: CLAIMS.sub,
      email: CLAIMS.email,
      organisationId: CLAIMS['custom:tenantId'],
      role: CLAIMS['custom:role'],
    });
    expect(result.current.authUnavailable).toBe(false);
    expect(result.current.loading).toBe(false);
  });

  it('treats no stored session as signed out, without retrying', async () => {
    getCurrentUser.mockRejectedValue(namedError('UserUnAuthenticatedException'));

    const result = await renderAuth();

    expect(result.current.user).toBeNull();
    expect(result.current.authUnavailable).toBe(false);
    expect(result.current.error).toBeNull();
    expect(getCurrentUser).toHaveBeenCalledTimes(1);
  });

  it('recovers the session when a transient failure clears on retry', async () => {
    getCurrentUser.mockRejectedValueOnce(namedError('NetworkError'));

    const result = await renderAuth();

    expect(result.current.user?.userId).toBe(CLAIMS.sub);
    expect(result.current.authUnavailable).toBe(false);
    expect(getCurrentUser).toHaveBeenCalledTimes(2);
  });

  it('reports the service unavailable, keeping the session, when retries run out', async () => {
    fetchAuthSession.mockRejectedValue(namedError('NetworkError'));

    const result = await renderAuth();

    expect(result.current.user).toBeNull();
    expect(result.current.authUnavailable).toBe(true);
    expect(fetchAuthSession).toHaveBeenCalledTimes(2);
    expect(signOut).not.toHaveBeenCalled();
  });

  it('lets a newer check win over an older one still waiting to retry', async () => {
    getCurrentUser
      .mockRejectedValueOnce(namedError('NetworkError'))
      .mockResolvedValueOnce({ userId: CLAIMS.sub })
      .mockRejectedValueOnce(namedError('NetworkError'));
    const { result } = renderHook(() => useAuth(), { wrapper });

    // The mount check failed once and is waiting to retry; a sign-in starts a newer check
    await act(async () => {
      await result.current.checkAuth();
    });
    expect(result.current.user?.userId).toBe(CLAIMS.sub);

    // The mount check's retry then fails, and must not overwrite the newer result
    await act(async () => {
      await vi.runAllTimersAsync();
    });

    expect(getCurrentUser).toHaveBeenCalledTimes(3);
    expect(result.current.user?.userId).toBe(CLAIMS.sub);
    expect(result.current.authUnavailable).toBe(false);
    expect(result.current.loading).toBe(false);
  });

  it('clears the unavailable state when a later check succeeds', async () => {
    fetchAuthSession.mockRejectedValue(namedError('TooManyRequestsException'));
    const result = await renderAuth();
    expect(result.current.authUnavailable).toBe(true);

    fetchAuthSession.mockResolvedValue({ tokens: { idToken: { payload: CLAIMS } } });
    await act(async () => {
      await result.current.checkAuth();
    });

    expect(result.current.authUnavailable).toBe(false);
    expect(result.current.user?.userId).toBe(CLAIMS.sub);
  });

  it('reports an expired session when no id token comes back', async () => {
    fetchAuthSession.mockResolvedValue({ tokens: undefined });

    const result = await renderAuth();

    expect(result.current.user).toBeNull();
    expect(result.current.error).toBe('Your session has expired. Please log in again.');
    expect(result.current.authUnavailable).toBe(false);
  });

  it('signs out locally when the token claims are invalid', async () => {
    fetchAuthSession.mockResolvedValue({
      tokens: { idToken: { payload: { ...CLAIMS, 'custom:role': 'not_a_role' } } },
    });

    const result = await renderAuth();

    expect(result.current.user).toBeNull();
    expect(result.current.error).toMatch(/^Invalid JWT claims: custom:role/);
    expect(signOut).toHaveBeenCalledWith({ global: false });
    expect(fetchAuthSession).toHaveBeenCalledTimes(1);
  });
});
