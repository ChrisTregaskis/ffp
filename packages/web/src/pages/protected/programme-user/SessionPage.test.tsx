import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ApiError } from '@web/lib/api/client';

import { SessionPage } from './SessionPage';

const { useProgrammeDetailQuery } = vi.hoisted(() => ({ useProgrammeDetailQuery: vi.fn() }));

vi.mock('@web/hooks/programmes', () => ({ useProgrammeDetailQuery }));
vi.mock('@web/hooks/sessions', () => ({
  useStartSessionMutation: () => ({ isPending: false, mutate: vi.fn() }),
  useCompleteSessionMutation: () => ({ isPending: false, mutate: vi.fn() }),
}));
vi.mock('@web/hooks/exercises', () => ({
  useToggleExerciseMutation: () => ({ isPending: false, mutate: vi.fn() }),
}));
vi.mock('@web/hooks/useToast', () => ({ useToast: () => ({ addToast: vi.fn() }) }));

const renderPage = (): void => {
  render(
    <MemoryRouter initialEntries={['/programme/session/phase1/session1']}>
      <Routes>
        <Route path="/programme/session/:phaseId/:templateSessionId" element={<SessionPage />} />
      </Routes>
    </MemoryRouter>
  );
};

describe('SessionPage', () => {
  const refetch = vi.fn();

  beforeEach(() => {
    refetch.mockReset();
  });

  it('keeps loading, not "not found", while the query is pending without data or error', () => {
    useProgrammeDetailQuery.mockReturnValue({ isPending: true, error: null, refetch });

    renderPage();

    expect(screen.getByRole('status', { name: 'Loading' })).toBeTruthy();
    expect(screen.queryByText('Session not found.')).toBeNull();
    expect(screen.queryByRole('button', { name: 'Try again' })).toBeNull();
  });

  it('says the session was not found when there is no programme', () => {
    useProgrammeDetailQuery.mockReturnValue({
      isPending: false,
      error: new ApiError(404, 'NOT_FOUND', 'Active programme not found'),
      refetch,
    });

    renderPage();

    expect(screen.getByText('Session not found.')).toBeTruthy();
  });

  it('shows an error with a retry when the programme fails to load', async () => {
    useProgrammeDetailQuery.mockReturnValue({
      isPending: false,
      error: new ApiError(500, 'INTERNAL_ERROR', 'Something broke'),
      refetch,
    });

    renderPage();

    expect(screen.getByText("We couldn't load this session just now.")).toBeTruthy();
    expect(screen.queryByText('Session not found.')).toBeNull();
    await userEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(refetch).toHaveBeenCalledTimes(1);
  });
});
