import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { useNewPasswordFields } from './useNewPasswordFields';

const STRONG = 'Calm-Harbour-42';

describe('useNewPasswordFields', () => {
  it('is not ready until every requirement is met and both entries match', () => {
    const { result } = renderHook(() => useNewPasswordFields());

    expect(result.current.isReady).toBe(false);

    act(() => {
      result.current.setPassword(STRONG);
    });
    expect(result.current.validation.allRequirementsMet).toBe(true);
    expect(result.current.isReady).toBe(false);

    act(() => {
      result.current.setConfirmPassword(STRONG);
    });
    expect(result.current.passwordsMatch).toBe(true);
    expect(result.current.isReady).toBe(true);
  });

  it('shows a mismatch only once the confirmation has been typed in', () => {
    const { result } = renderHook(() => useNewPasswordFields());

    act(() => {
      result.current.setPassword(STRONG);
    });
    expect(result.current.passwordsMatch).toBe(false);
    expect(result.current.showConfirmPasswordError).toBe(false);

    act(() => {
      result.current.setConfirmPassword('Calm-Harbour');
    });
    expect(result.current.showConfirmPasswordError).toBe(true);

    act(() => {
      result.current.setConfirmPassword('');
    });
    expect(result.current.showConfirmPasswordError).toBe(false);
  });
});
