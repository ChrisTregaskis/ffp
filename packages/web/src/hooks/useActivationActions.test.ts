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

interface DeactivateCallbacks {
  onSuccess: () => void;
  onError: (err: Error) => void;
}

interface Setup {
  result: { current: ActivationActions<Target> };
  mutate: ReturnType<typeof vi.fn>;
  activate: ReturnType<typeof vi.fn>;
  onDeactivated: ReturnType<typeof vi.fn>;
}

const setup = (outcome: 'success' | 'error', onDeactivated = vi.fn()): Setup => {
  const mutate = vi.fn((_publicId: string, callbacks: DeactivateCallbacks) => {
    if (outcome === 'success') {
      callbacks.onSuccess();
    } else {
      callbacks.onError(new Error('It went wrong'));
    }
  });
  const activate = vi.fn((_publicId: string, callbacks: ActivationCallbacks) => {
    if (outcome === 'success') {
      callbacks.onSuccess();
    } else {
      callbacks.onError(new Error('It went wrong'));
    }
  });

  const { result } = renderHook(() =>
    useActivationActions<Target>({
      deactivate: { mutate, isPending: false } as never,
      activate,
      isActivating: false,
      describe: describeTarget,
      onDeactivated,
    })
  );

  return { result, mutate, activate, onDeactivated };
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
    const { result, mutate, onDeactivated } = setup('success');

    act(() => {
      result.current.requestDeactivate(TARGET);
    });
    act(() => {
      result.current.confirmDeactivate();
    });

    expect(mutate).toHaveBeenCalledWith('aaaaaaaaaaaa', expect.anything());
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

  it('does nothing on confirm when nothing is pending', () => {
    const { result, mutate } = setup('success');

    act(() => {
      result.current.confirmDeactivate();
    });

    expect(mutate).not.toHaveBeenCalled();
  });

  it('activates a record and toasts', () => {
    const { result, activate } = setup('success');

    act(() => {
      result.current.activate(TARGET);
    });

    expect(activate).toHaveBeenCalledWith('aaaaaaaaaaaa', expect.anything());
    expect(addToast).toHaveBeenCalledWith('"Daily check" activated successfully', {
      variant: 'success',
    });
  });
});
