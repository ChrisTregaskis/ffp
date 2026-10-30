import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { AdminProgrammeDetailResponse } from '@ffp/core';

import { videoDetail, videoSearchPage } from '@web/components/video/video-test-fixture';
import { ToastProvider } from '@web/contexts/toast/ToastContext';
import { useUserProgrammeQuery } from '@web/hooks/users';
import type * as UserHooks from '@web/hooks/users';
import { ApiError } from '@web/lib/api/client';
import { adminMemberProgrammeApi, adminVideosApi } from '@web/lib/api/endpoints';
import type * as Endpoints from '@web/lib/api/endpoints';
import { videosApi } from '@web/lib/api/endpoints/videos';

import { MemberProgrammePhasePage } from './MemberProgrammePhasePage';
import { exercise, memberProgramme, session } from './programme-fixture';

// The read is stubbed; the edits run through the real mutation hooks to a mocked API
vi.mock('@web/hooks/users', async (importOriginal) => ({
  ...(await importOriginal<typeof UserHooks>()),
  useUserProgrammeQuery: vi.fn(),
}));

vi.mock('@web/lib/api/endpoints', async (importOriginal) => ({
  ...(await importOriginal<typeof Endpoints>()),
  adminMemberProgrammeApi: {
    addExercise: vi.fn(),
    updateExercise: vi.fn(),
    removeExercise: vi.fn(),
    reorderExercises: vi.fn(),
    reorderSessions: vi.fn(),
  },
  adminVideosApi: { list: vi.fn() },
}));

vi.mock('@web/lib/api/endpoints/videos', () => ({ videosApi: { get: vi.fn() } }));

const api = vi.mocked(adminMemberProgrammeApi);
const listVideos = vi.mocked(adminVideosApi.list);
const getVideo = vi.mocked(videosApi.get);

const MEMBER = 'sharronxxxxx';
const mockedProgrammeQuery = vi.mocked(useUserProgrammeQuery);
const refetch = vi.fn();

type ProgrammeQuery = ReturnType<typeof useUserProgrammeQuery>;

const renderPage = (phaseId: string, query: Partial<ProgrammeQuery>): void => {
  mockedProgrammeQuery.mockReturnValue({
    data: undefined,
    isPending: false,
    error: null,
    refetch,
    ...query,
  } as ProgrammeQuery);

  render(
    <QueryClientProvider client={new QueryClient()}>
      <ToastProvider>
        <MemoryRouter initialEntries={[`/admin/users/${MEMBER}/programme/phases/${phaseId}`]}>
          <Routes>
            <Route
              path="/admin/users/:id/programme/phases/:phaseId"
              element={<MemberProgrammePhasePage />}
            />
          </Routes>
        </MemoryRouter>
      </ToastProvider>
    </QueryClientProvider>
  );
};

describe('MemberProgrammePhasePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedProgrammeQuery.mockReset();
  });

  it('lists an upcoming phase’s sessions with their exercises and prescriptions', async () => {
    renderPage('phasetwoxxxx', { data: memberProgramme() });

    expect(screen.getByRole('heading', { name: 'Building Up — Sessions' })).toBeTruthy();
    expect(screen.getByText('Adds a little more load.').textContent).toBe(
      'Adds a little more load.'
    );
    expect(screen.getByText('Upcoming').textContent).toBe('Upcoming');

    await userEvent.click(screen.getByRole('button', { name: /^Session 1/ }));

    expect(screen.getByText('Bodyweight Squat').textContent).toBe('Bodyweight Squat');
    expect(screen.getByText('Wall Press').textContent).toBe('Wall Press');
    expect(screen.getAllByText('3 sets × 8–12 · Rest 45s')).toHaveLength(2);
    expect(screen.getByText('Aim for full depth').tagName).toBe('STRONG');
  });

  it('says so when the phase is not in the member’s programme', () => {
    renderPage('unknownphase', { data: memberProgramme() });

    expect(screen.getByText("This phase isn't part of the member's programme.").textContent).toBe(
      "This phase isn't part of the member's programme."
    );
  });

  it('says the member has no programme when the read answers 404', () => {
    renderPage('phasetwoxxxx', {
      error: new ApiError(404, 'NOT_FOUND', 'Active programme not found'),
    });

    expect(screen.getByText("This member doesn't have a programme yet.").textContent).toBe(
      "This member doesn't have a programme yet."
    );
    expect(screen.queryByRole('button', { name: 'Try again' })).toBeNull();
  });

  it('offers a retry when the programme fails to load', async () => {
    renderPage('phasetwoxxxx', { error: new ApiError(500, 'INTERNAL_ERROR', 'Server error') });

    await userEvent.click(screen.getByRole('button', { name: 'Try again' }));

    expect(refetch).toHaveBeenCalledTimes(1);
  });

  describe('editing', () => {
    const NEW_VIDEO = { id: '77777777-7777-7777-8777-777777770005', title: 'Single Leg Balance' };

    const phaseTwo = (
      detail: AdminProgrammeDetailResponse
    ): AdminProgrammeDetailResponse['phases'][number] => detail.phases[1];

    const openMenu = async (name: string): Promise<void> => {
      await userEvent.click(screen.getByRole('button', { name: `Actions for ${name}` }));
    };

    const choose = async (item: string): Promise<void> => {
      await userEvent.click(screen.getByRole('menuitem', { name: item }));
    };

    const pickVideo = async (
      title: string,
      defaults: Parameters<typeof videoDetail>[2] = {}
    ): Promise<void> => {
      getVideo.mockResolvedValue(videoDetail(NEW_VIDEO.id, NEW_VIDEO.title, defaults));
      await userEvent.type(screen.getByLabelText('Search videos'), 'si');
      await userEvent.click(await screen.findByRole('button', { name: new RegExp(title) }));
    };

    beforeEach(() => {
      Object.values(api).forEach((mock) => mock.mockResolvedValue(undefined as never));
    });

    it('shows a started session read-only, with the reason', async () => {
      renderPage('phaseonexxxx', { data: memberProgramme() });

      await userEvent.click(screen.getByRole('button', { name: /^Session 2/ }));

      expect(
        screen.getByText('This session is under way, so it can no longer be changed.').textContent
      ).toBe('This session is under way, so it can no longer be changed.');
      expect(screen.queryByRole('button', { name: /^Actions for/ })).toBeNull();
    });

    it('warns when a session holds fewer than three exercises', async () => {
      renderPage('phasetwoxxxx', { data: memberProgramme() });

      await userEvent.click(screen.getByRole('button', { name: /^Session 1/ }));

      expect(
        screen.getByText('Sessions usually hold at least 3 exercises; this one has 2.').textContent
      ).toBe('Sessions usually hold at least 3 exercises; this one has 2.');
    });

    it('adds an exercise picked from the catalogue, leaving out the session’s own videos', async () => {
      const detail = memberProgramme();
      const target = phaseTwo(detail).sessions[0];
      const [squat] = target.exercises ?? [];
      listVideos.mockResolvedValue(
        videoSearchPage([{ id: squat.video.id, title: 'Bodyweight Squat (catalogue)' }, NEW_VIDEO])
      );
      renderPage('phasetwoxxxx', { data: detail });

      await openMenu('Session 1');
      await choose('Add exercise');
      await userEvent.type(screen.getByLabelText('Search videos'), 'si');
      await screen.findByRole('button', { name: /Single Leg Balance/ });

      expect(screen.queryByRole('button', { name: /Bodyweight Squat \(catalogue\)/ })).toBeNull();

      getVideo.mockResolvedValue(videoDetail(NEW_VIDEO.id, NEW_VIDEO.title, { defaultSets: 2 }));
      await userEvent.click(screen.getByRole('button', { name: /Single Leg Balance/ }));
      await userEvent.click(screen.getByRole('button', { name: 'Add exercise' }));

      await waitFor(() => {
        expect(api.addExercise).toHaveBeenCalledWith(MEMBER, target.userSession?.id, {
          videoId: NEW_VIDEO.id,
          sets: 2,
          reps: undefined,
          durationSeconds: undefined,
          restSeconds: undefined,
          notes: undefined,
        });
      });
    });

    it('swaps an exercise, replacing its prescription with the new video’s', async () => {
      const detail = memberProgramme();
      const [, wallPress] = phaseTwo(detail).sessions[0].exercises ?? [];
      listVideos.mockResolvedValue(videoSearchPage([NEW_VIDEO]));
      renderPage('phasetwoxxxx', { data: detail });

      await userEvent.click(screen.getByRole('button', { name: /^Session 1/ }));
      await openMenu('Wall Press');
      await choose('Swap');
      await pickVideo('Single Leg Balance', { defaultSets: 2, defaultReps: '12' });
      await userEvent.click(screen.getByRole('button', { name: 'Swap exercise' }));

      // Rest had no default on the new video, so the swap clears it
      await waitFor(() => {
        expect(api.updateExercise).toHaveBeenCalledWith(MEMBER, wallPress.sessionExerciseId, {
          videoId: NEW_VIDEO.id,
          sets: 2,
          reps: '12',
          restSeconds: null,
        });
      });
    });

    it('edits a prescription, sending only what changed', async () => {
      const detail = memberProgramme();
      const [squat] = phaseTwo(detail).sessions[0].exercises ?? [];
      renderPage('phasetwoxxxx', { data: detail });

      await userEvent.click(screen.getByRole('button', { name: /^Session 1/ }));
      await openMenu('Bodyweight Squat');
      await choose('Edit');
      const sets = screen.getByRole('spinbutton', { name: /Sets/ });
      await userEvent.clear(sets);
      await userEvent.type(sets, '4');
      await userEvent.click(screen.getByRole('button', { name: 'Save' }));

      await waitFor(() => {
        expect(api.updateExercise).toHaveBeenCalledWith(MEMBER, squat.sessionExerciseId, {
          sets: 4,
        });
      });
    });

    it('keeps the form and its edits when a save is refused, and closes it once one lands', async () => {
      const detail = memberProgramme();
      const [squat] = phaseTwo(detail).sessions[0].exercises ?? [];
      api.updateExercise.mockRejectedValueOnce(
        new ApiError(409, 'CONFLICT', 'This session is under way, so it can no longer be changed.')
      );
      renderPage('phasetwoxxxx', { data: detail });

      await userEvent.click(screen.getByRole('button', { name: /^Session 1/ }));
      await openMenu('Bodyweight Squat');
      await choose('Edit');
      const sets = screen.getByRole('spinbutton', { name: /Sets/ });
      await userEvent.clear(sets);
      await userEvent.type(sets, '4');
      await userEvent.click(screen.getByRole('button', { name: 'Save' }));

      await screen.findByText('This session is under way, so it can no longer be changed.');
      expect(screen.getByRole<HTMLInputElement>('spinbutton', { name: /Sets/ }).value).toBe('4');

      await userEvent.click(screen.getByRole('button', { name: 'Save' }));

      await waitFor(() => {
        expect(screen.queryByRole('spinbutton', { name: /Sets/ })).toBeNull();
      });
      expect(api.updateExercise).toHaveBeenCalledTimes(2);
      expect(api.updateExercise).toHaveBeenLastCalledWith(MEMBER, squat.sessionExerciseId, {
        sets: 4,
      });
    });

    it('holds a session open while its form is in use', async () => {
      renderPage('phasetwoxxxx', { data: memberProgramme() });

      await openMenu('Session 1');
      await choose('Add exercise');
      await userEvent.click(screen.getByRole('button', { name: /^Session 1/ }));

      expect(screen.getByLabelText('Search videos').tagName).toBe('INPUT');
    });

    it('moves an exercise down', async () => {
      const detail = memberProgramme();
      const target = phaseTwo(detail).sessions[0];
      const [squat, wallPress] = target.exercises ?? [];
      renderPage('phasetwoxxxx', { data: detail });

      await userEvent.click(screen.getByRole('button', { name: /^Session 1/ }));
      await openMenu('Bodyweight Squat');
      await choose('Move down');

      await waitFor(() => {
        expect(api.reorderExercises).toHaveBeenCalledWith(MEMBER, target.userSession?.id, [
          wallPress.sessionExerciseId,
          squat.sessionExerciseId,
        ]);
      });
    });

    it('shows the server’s reason when a session’s last exercise cannot be removed', async () => {
      const reason = "A session needs at least one exercise, so its last one can't be removed.";
      const detail = memberProgramme({}, [
        session(1, 'not_started', [exercise(0, 'Glute Bridge', null)]),
      ]);
      const [only] = phaseTwo(detail).sessions[0].exercises ?? [];
      api.removeExercise.mockRejectedValue(new ApiError(409, 'CONFLICT', reason));
      renderPage('phasetwoxxxx', { data: detail });

      await userEvent.click(screen.getByRole('button', { name: /^Session 1/ }));
      await openMenu('Glute Bridge');
      await choose('Remove');
      await userEvent.click(screen.getByRole('button', { name: 'Remove' }));

      expect((await screen.findByText(reason)).textContent).toBe(reason);
      expect(api.removeExercise).toHaveBeenCalledWith(MEMBER, only.sessionExerciseId);
    });

    it('moves a session past another not yet started, never past a started one', async () => {
      const detail = memberProgramme({}, [
        session(1, 'completed', [exercise(0, 'Neck Rolls', null)]),
        session(2, 'not_started', [exercise(0, 'Wall Press', null)]),
        session(3, 'not_started', [exercise(0, 'Glute Bridge', null)]),
      ]);
      const [first, second, third] = phaseTwo(detail).sessions.map((each) => each.userSession?.id);
      renderPage('phasetwoxxxx', { data: detail });

      await openMenu('Session 2');

      expect(
        screen.getByRole('menuitem', { name: 'Move session up' }).getAttribute('aria-disabled')
      ).toBe('true');

      await choose('Move session down');

      await waitFor(() => {
        expect(api.reorderSessions).toHaveBeenCalledWith(MEMBER, phaseTwo(detail).id, [
          first,
          third,
          second,
        ]);
      });
    });
  });
});
