import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useVideoReplacement } from '@web/hooks/videos';
import type { UseVideoReplacementReturn } from '@web/hooks/videos/useVideoReplacement';

import { VideoReplacer } from './VideoReplacer';

vi.mock('@web/hooks/videos', () => ({ useVideoReplacement: vi.fn() }));

const file = new File([new Uint8Array(2048)], 'calf-raise.mp4', { type: 'video/mp4' });

const replacement = (
  overrides: Partial<UseVideoReplacementReturn['progress']> = {},
  selected: File | null = file
): UseVideoReplacementReturn => ({
  fileSelection: {
    file: selected,
    validationError: null,
    detectedDuration: selected ? 95 : null,
    isReady: selected !== null,
    selectFile: vi.fn(),
    clearFile: vi.fn(),
  },
  progress: { phase: 'idle', uploadProgress: 0, error: null, ...overrides },
  handleConfirmReplace: vi.fn(),
  handleClear: vi.fn(),
  isBusy: false,
});

describe('VideoReplacer', () => {
  beforeEach(() => {
    vi.mocked(useVideoReplacement).mockReset();
  });

  it('offers a drop zone until a file is chosen', () => {
    vi.mocked(useVideoReplacement).mockReturnValue(replacement({}, null));
    render(<VideoReplacer publicId="vidABCDE1234" />);

    expect(screen.getByRole('button', { name: 'Select replacement video file' })).toBeTruthy();
  });

  it('shows the chosen file with its size and duration', () => {
    vi.mocked(useVideoReplacement).mockReturnValue(replacement());
    render(<VideoReplacer publicId="vidABCDE1234" />);

    expect(screen.getByText('calf-raise.mp4')).toBeTruthy();
    expect(screen.getByText(/2\.0 KB · 1:35/)).toBeTruthy();
  });

  it('shows the upload progress', () => {
    vi.mocked(useVideoReplacement).mockReturnValue(
      replacement({ phase: 'uploading', uploadProgress: 40 })
    );
    render(<VideoReplacer publicId="vidABCDE1234" />);

    expect(screen.getByRole('progressbar', { name: 'Upload progress' })).toBeTruthy();
    expect(screen.getByText('40%')).toBeTruthy();
  });
});
