import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { isTransientAuthError, retryTransientAuthError } from './auth-retry';

const namedError = (name: string): Error => Object.assign(new Error(name), { name });

describe('isTransientAuthError', () => {
  it.each([
    'NetworkError',
    'InternalErrorException',
    'TooManyRequestsException',
    'SyntaxError',
    'UnknownError',
    'Unknown',
  ])('treats %s as transient, since Amplify keeps the session', (name) => {
    expect(isTransientAuthError(namedError(name))).toBe(true);
  });

  it.each([
    'UserUnAuthenticatedException',
    'NotAuthorizedException',
    'TokenRevokedException',
    'UserNotFoundException',
    'PasswordResetRequiredException',
    'UserNotConfirmedException',
    'RefreshTokenReuseException',
    'AuthUserPoolException',
    'Error',
  ])('treats %s as signed out', (name) => {
    expect(isTransientAuthError(namedError(name))).toBe(false);
  });

  it('treats a non-error value as signed out', () => {
    expect(isTransientAuthError({ name: 'NetworkError' })).toBe(false);
  });
});

describe('retryTransientAuthError', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns the first success without waiting', async () => {
    const attempt = vi.fn().mockResolvedValue('ok');

    await expect(retryTransientAuthError(attempt, [500, 1500])).resolves.toBe('ok');
    expect(attempt).toHaveBeenCalledTimes(1);
  });

  it('retries a transient failure after each delay until it succeeds', async () => {
    const attempt = vi
      .fn()
      .mockRejectedValueOnce(namedError('NetworkError'))
      .mockRejectedValueOnce(namedError('NetworkError'))
      .mockResolvedValue('ok');

    const result = retryTransientAuthError(attempt, [500, 1500]);

    await vi.advanceTimersByTimeAsync(499);
    expect(attempt).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(1);
    expect(attempt).toHaveBeenCalledTimes(2);
    await vi.advanceTimersByTimeAsync(1500);

    await expect(result).resolves.toBe('ok');
    expect(attempt).toHaveBeenCalledTimes(3);
  });

  it('re-throws a transient failure once the delays run out', async () => {
    const attempt = vi.fn().mockRejectedValue(namedError('NetworkError'));

    const result = retryTransientAuthError(attempt, [500, 1500]);
    const assertion = expect(result).rejects.toThrow('NetworkError');
    await vi.runAllTimersAsync();

    await assertion;
    expect(attempt).toHaveBeenCalledTimes(3);
  });

  it('re-throws a signed-out failure without retrying', async () => {
    const attempt = vi.fn().mockRejectedValue(namedError('UserUnAuthenticatedException'));

    await expect(retryTransientAuthError(attempt, [500, 1500])).rejects.toThrow(
      'UserUnAuthenticatedException'
    );
    expect(attempt).toHaveBeenCalledTimes(1);
  });
});
