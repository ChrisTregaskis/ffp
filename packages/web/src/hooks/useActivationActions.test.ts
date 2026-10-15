import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useActivationActions } from './useActivationActions';

import type { ActivationActions, ActivationCallbacks } from './useActivationActions';

const addToast = vi.fn();

vi.mock('@web/hooks/useToast', () => ({ useToast: () => ({ addToast }) }));

interface Target {
  publicId: string;
  name: string;
}

const TARGET: Target = { publicId: 'aaaaaaaaaaaa', name: 'Daily check' };
const describeTarget = (target: Target): string => `"${target.name}"`;

interface Setup {
  result: { current: ActivationActions<Target> };
  deactivate: ReturnType<typeof vi.fn>;
  activate: ReturnType<typeof vi.fn>;
  onDeactivated: ReturnType<typeof vi.fn>;
}

const setup = (
  outcome: 'success' | 'error',
  onDeactivated = vi.fn(),
  { isDeactivating = false, isActivating = false } = {}
): Setup => {
  const settle = (_target: Target, callbacks: ActivationCallbacks): void => {
    if (outcome === 'success') {
      callbacks.onSuccess();
    } else {
      callbacks.onError(new Error('It went wrong'));
    }
  };
  const deactivate = vi.fn(settle);
  const activate = vi.fn(settle);

  const { result } = renderHook(() =>
    useActivationActions<Target>({
      deactivate,
      isDeactivating,
      activate,
      isActivating,
      describe: describeTarget,
      onDeactivated,
    })
  );

  return { result, deactivate, activate, onDeactivated };
};

describe('useActivationActions', () => {
  beforeEach(() => {
    addToast.mockClear();
  });

  it('holds the record awaiting confirmation until cancelled', () => {
    const { result } = setup('success');

    act(() => {
      result.current.requestDeactivate(TARGET);
    });
    expect(result.current.pending).toBe(TARGET);

    act(() => {
      result.current.cancelDeactivate();
    });
    expect(result.current.pending).toBeNull();
  });

  it('deactivates the pending record, toasts, clears it and runs onDeactivated', () => {
    const { result, deactivate, onDeactivated } = setup('success');

    act(() => {
      result.current.requestDeactivate(TARGET);
    });
    act(() => {
      result.current.confirmDeactivate();
    });

    expect(deactivate).toHaveBeenCalledWith(TARGET, expect.anything());
    expect(addToast).toHaveBeenCalledWith('"Daily check" deactivated successfully', {
      variant: 'success',
    });
    expect(result.current.pending).toBeNull();
    expect(onDeactivated).toHaveBeenCalledOnce();
  });

  it('shows a failed deactivation and stays put', () => {
    const { result, onDeactivated } = setup('error');

    act(() => {
      result.current.requestDeactivate(TARGET);
    });
    act(() => {
      result.current.confirmDeactivate();
    });

    expect(addToast).toHaveBeenCalledWith('It went wrong', { variant: 'error' });
    expect(result.current.pending).toBeNull();
    expect(onDeactivated).not.toHaveBeenCalled();
  });

  it('keeps a record requested while an earlier deactivation was in flight', () => {
    let settle: ActivationCallbacks | undefined;
    const deactivate = vi.fn((_target: Target, callbacks: ActivationCallbacks) => {
      settle = callbacks;
    });
    const other: Target = { publicId: 'bbbbbbbbbbbb', name: 'Evening stretch' };

    const { result } = renderHook(() =>
      useActivationActions<Target>({
        deactivate,
        isDeactivating: false,
        activate: vi.fn(),
        isActivating: false,
        describe: describeTarget,
      })
    );

    act(() => {
      result.current.requestDeactivate(TARGET);
    });
    act(() => {
      result.current.confirmDeactivate();
    });
    act(() => {
      result.current.requestDeactivate(other);
    });
    act(() => {
      settle?.onSuccess();
    });

    expect(result.current.pending).toBe(other);
  });

  it('does nothing on confirm when nothing is pending', () => {
    const { result, deactivate } = setup('success');

    act(() => {
      result.current.confirmDeactivate();
    });

    expect(deactivate).not.toHaveBeenCalled();
  });

  it('activates a record and toasts', () => {
    const { result, activate } = setup('success');

    act(() => {
      result.current.activate(TARGET);
    });

    expect(activate).toHaveBeenCalledWith(TARGET, expect.anything());
    expect(addToast).toHaveBeenCalledWith('"Daily check" activated successfully', {
      variant: 'success',
    });
  });

  it('shows a failed activation', () => {
    const { result } = setup('error');

    act(() => {
      result.current.activate(TARGET);
    });

    expect(addToast).toHaveBeenCalledWith('It went wrong', { variant: 'error' });
  });

  it('passes the pending flags through', () => {
    const { result } = setup('success', vi.fn(), { isDeactivating: true, isActivating: true });

    expect(result.current.isDeactivating).toBe(true);
    expect(result.current.isActivating).toBe(true);
  });
});
