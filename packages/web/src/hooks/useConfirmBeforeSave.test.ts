import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { useConfirmBeforeSave } from './useConfirmBeforeSave';

import type { ConfirmBeforeSave } from './useConfirmBeforeSave';
import type { Mock } from 'vitest';

interface Payload {
  status: string;
}
type Save = (payload: Payload) => Promise<void>;

const renderConfirm = (
  save: Mock<Save> = vi.fn<Save>(() => Promise.resolve())
): { result: { current: ConfirmBeforeSave<Payload> }; save: Mock<Save> } => {
  const { result } = renderHook(() => useConfirmBeforeSave<Payload>(save));

  return { result, save };
};

/** Records how the request's promise settled, without awaiting it */
const track = (promise: Promise<void>): { outcome: string } => {
  const state = { outcome: 'pending' };
  promise.then(
    () => {
      state.outcome = 'resolved';
    },
    (err: Error) => {
      state.outcome = `rejected: ${err.message}`;
    }
  );

  return state;
};

describe('useConfirmBeforeSave', () => {
  it('opens the modal and sends nothing until confirmed', () => {
    const { result, save } = renderConfirm();

    act(() => {
      void result.current.requestConfirm({ status: 'inactive' }).catch(() => undefined);
    });

    expect(result.current.isConfirmOpen).toBe(true);
    expect(save).not.toHaveBeenCalled();
  });

  it('runs the save on confirm and resolves once it lands', async () => {
    const { result, save } = renderConfirm();
    let request: { outcome: string } = { outcome: '' };

    act(() => {
      request = track(result.current.requestConfirm({ status: 'inactive' }));
    });

    await act(async () => {
      result.current.confirm();
      await Promise.resolve();
    });

    expect(save).toHaveBeenCalledWith({ status: 'inactive' });
    expect(result.current.isConfirmOpen).toBe(false);
    expect(request.outcome).toBe('resolved');
  });

  it('rejects when the confirmed save fails', async () => {
    const { result } = renderConfirm(vi.fn<Save>(() => Promise.reject(new Error('Save failed'))));
    let request: { outcome: string } = { outcome: '' };

    act(() => {
      request = track(result.current.requestConfirm({ status: 'inactive' }));
    });

    await act(async () => {
      result.current.confirm();
      await Promise.resolve();
    });

    expect(request.outcome).toBe('rejected: Save failed');
  });

  it('rejects on cancel without saving', async () => {
    const { result, save } = renderConfirm();
    let request: { outcome: string } = { outcome: '' };

    act(() => {
      request = track(result.current.requestConfirm({ status: 'inactive' }));
    });

    await act(async () => {
      result.current.cancel();
      await Promise.resolve();
    });

    expect(save).not.toHaveBeenCalled();
    expect(result.current.isConfirmOpen).toBe(false);
    expect(request.outcome).toBe('rejected: Save cancelled');
  });

  it('settles only once when a second click lands after the first', async () => {
    const { result, save } = renderConfirm();
    let request: { outcome: string } = { outcome: '' };

    act(() => {
      request = track(result.current.requestConfirm({ status: 'inactive' }));
    });

    await act(async () => {
      result.current.confirm();
      result.current.confirm();
      result.current.cancel();
      await Promise.resolve();
    });

    expect(save).toHaveBeenCalledTimes(1);
    expect(request.outcome).toBe('resolved');
  });
});
