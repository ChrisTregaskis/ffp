import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { adminVideosApi } from '@web/lib/api/endpoints';
import type * as Endpoints from '@web/lib/api/endpoints';
import { videosApi } from '@web/lib/api/endpoints/videos';

import { videoSearchPage } from './video-test-fixture';
import { VideoSelector } from './VideoSelector';

vi.mock('@web/lib/api/endpoints', async (importOriginal) => ({
  ...(await importOriginal<typeof Endpoints>()),
  adminVideosApi: { list: vi.fn() },
}));

vi.mock('@web/lib/api/endpoints/videos', () => ({ videosApi: { get: vi.fn() } }));

const SQUAT = { id: '77777777-7777-7777-8777-777777770004', title: 'Bodyweight Squat' };
const SQUAT_HOLD = { id: '77777777-7777-7777-8777-777777770011', title: 'Squat Hold' };

const list = vi.mocked(adminVideosApi.list);
const getVideo = vi.mocked(videosApi.get);

const renderSelector = (excludeVideoIds?: string[], onSelect = vi.fn()): void => {
  render(
    <QueryClientProvider
      client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
    >
      <VideoSelector onSelect={onSelect} excludeVideoIds={excludeVideoIds} />
    </QueryClientProvider>
  );
};

const search = async (term: string): Promise<void> => {
  await userEvent.type(screen.getByLabelText('Search videos'), term);
};

describe('VideoSelector', () => {
  beforeEach(() => {
    list.mockReset();
    getVideo.mockReset();
  });

  it('leaves the excluded videos out of the results', async () => {
    list.mockResolvedValue(videoSearchPage([SQUAT, SQUAT_HOLD]));
    renderSelector([SQUAT.id]);

    await search('squat');

    expect((await screen.findByRole('button', { name: /Squat Hold/ })).textContent).toContain(
      'Squat Hold'
    );
    expect(screen.queryByRole('button', { name: /Bodyweight Squat/ })).toBeNull();
  });

  it('offers a retry when the search fails, rather than reading as no results', async () => {
    list.mockRejectedValueOnce(new Error('Network error'));
    list.mockResolvedValueOnce(videoSearchPage([SQUAT_HOLD]));
    renderSelector();

    await search('squat');

    expect((await screen.findByText("We couldn't search the videos just now.")).textContent).toBe(
      "We couldn't search the videos just now."
    );
    expect(screen.queryByText('No videos found')).toBeNull();

    await userEvent.click(screen.getByRole('button', { name: 'Try again' }));

    expect((await screen.findByRole('button', { name: /Squat Hold/ })).textContent).toContain(
      'Squat Hold'
    );
    expect(list).toHaveBeenCalledTimes(2);
  });

  it('closes the results on a click outside', async () => {
    list.mockResolvedValue(videoSearchPage([SQUAT_HOLD]));
    renderSelector();

    await search('squat');
    await screen.findByRole('button', { name: /Squat Hold/ });
    await userEvent.click(document.body);

    expect(screen.queryByRole('button', { name: /Squat Hold/ })).toBeNull();
  });

  it('says so when the picked video cannot be opened, selecting nothing', async () => {
    const onSelect = vi.fn();
    list.mockResolvedValue(videoSearchPage([SQUAT_HOLD]));
    getVideo.mockRejectedValue(new Error('Not found'));
    renderSelector(undefined, onSelect);

    await search('squat');
    await userEvent.click(await screen.findByRole('button', { name: /Squat Hold/ }));

    expect((await screen.findByRole('alert')).textContent).toBe(
      "We couldn't open that video just now. Please pick it again."
    );
    expect(onSelect).not.toHaveBeenCalled();
  });
});
