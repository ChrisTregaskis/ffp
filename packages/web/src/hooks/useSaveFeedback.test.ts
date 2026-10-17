import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useSaveFeedback } from './useSaveFeedback';

const addToast = vi.fn();

vi.mock('@web/hooks/useToast', () => ({ useToast: () => ({ addToast }) }));

describe('useSaveFeedback', () => {
  beforeEach(() => {
    addToast.mockClear();
  });

  it('toasts a fixed message, then runs the follow-up with the result', () => {
    const { result } = renderHook(() => useSaveFeedback());
    const then = vi.fn();

    act(() => {
      result.current.saveCallbacks<{ name: string }>('Saved', then).onSuccess({ name: 'A' });
    });

    expect(addToast).toHaveBeenCalledWith('Saved', { variant: 'success' });
    expect(then).toHaveBeenCalledWith({ name: 'A' });
  });

  it('builds the message from the result', () => {
    const { result } = renderHook(() => useSaveFeedback());

    act(() => {
      result.current
        .saveCallbacks<{ name: string }>((saved) => `"${saved.name}" saved`)
        .onSuccess({ name: 'Daily check' });
    });

    expect(addToast).toHaveBeenCalledWith('"Daily check" saved', { variant: 'success' });
  });

  it('keeps a failure as the submit error until cleared', () => {
    const { result } = renderHook(() => useSaveFeedback());

    act(() => {
      result.current.saveCallbacks('Saved').onError(new Error('Slug already taken'));
    });
    expect(result.current.submitError).toBe('Slug already taken');
    expect(addToast).not.toHaveBeenCalled();

    act(() => {
      result.current.clearSubmitError();
    });
    expect(result.current.submitError).toBeNull();
  });

  it('shows the mapped message when a failure is mapped', () => {
    const { result } = renderHook(() => useSaveFeedback());
    const mapError = vi.fn((err: Error) => `Mapped: ${err.message}`);
    const failure = new Error('Conflict');

    act(() => {
      result.current.saveCallbacks('Saved', undefined, { mapError }).onError(failure);
    });

    expect(mapError).toHaveBeenCalledWith(failure);
    expect(result.current.submitError).toBe('Mapped: Conflict');
  });
});
