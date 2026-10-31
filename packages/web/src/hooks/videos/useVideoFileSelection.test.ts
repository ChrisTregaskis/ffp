import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { detectVideoDuration } from './helpers/detectVideoDuration';
import { useVideoFileSelection } from './useVideoFileSelection';

vi.mock('./helpers/detectVideoDuration', () => ({ detectVideoDuration: vi.fn() }));

const video = (name: string): File => new File(['frames'], name, { type: 'video/mp4' });

/** A duration probe the test resolves by hand */
const pendingProbe = (): {
  promise: Promise<number | null>;
  resolve: (value: number | null) => void;
} => {
  let resolve: (value: number | null) => void = () => undefined;
  const promise = new Promise<number | null>((done) => {
    resolve = done;
  });

  return { promise, resolve };
};

describe('useVideoFileSelection', () => {
  beforeEach(() => {
    vi.mocked(detectVideoDuration).mockReset();
  });

  it("keeps the current file's duration when an earlier probe finishes last", async () => {
    const first = pendingProbe();
    const second = pendingProbe();
    vi.mocked(detectVideoDuration)
      .mockReturnValueOnce(first.promise)
      .mockReturnValueOnce(second.promise);
    const { result } = renderHook(() => useVideoFileSelection());

    act(() => {
      result.current.selectFile(video('first.mp4'));
    });
    act(() => {
      result.current.selectFile(video('second.mp4'));
    });
    await act(async () => {
      second.resolve(42);
      await second.promise;
    });
    await act(async () => {
      first.resolve(300);
      await first.promise;
    });

    expect(result.current.file?.name).toBe('second.mp4');
    expect(result.current.detectedDuration).toBe(42);
  });

  it('marks a file whose length cannot be read as invalid', async () => {
    vi.mocked(detectVideoDuration).mockResolvedValue(null);
    const { result } = renderHook(() => useVideoFileSelection());

    await act(async () => {
      result.current.selectFile(video('broken.mp4'));
      await Promise.resolve();
    });

    expect(result.current.validationError).toMatch(/couldn't read this video's length/);
    expect(result.current.isReady).toBe(false);
  });
});
