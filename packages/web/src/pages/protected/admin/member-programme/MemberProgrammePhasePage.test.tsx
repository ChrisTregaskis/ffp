import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useUserProgrammeQuery } from '@web/hooks/users';
import { ApiError } from '@web/lib/api/client';

import { MemberProgrammePhasePage } from './MemberProgrammePhasePage';
import { memberProgramme } from './programme-fixture';

vi.mock('@web/hooks/users', () => ({ useUserProgrammeQuery: vi.fn() }));

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
    <MemoryRouter initialEntries={[`/admin/users/sharronxxxxx/programme/phases/${phaseId}`]}>
      <Routes>
        <Route
          path="/admin/users/:id/programme/phases/:phaseId"
          element={<MemberProgrammePhasePage />}
        />
      </Routes>
    </MemoryRouter>
  );
};

describe('MemberProgrammePhasePage', () => {
  beforeEach(() => {
    mockedProgrammeQuery.mockReset();
    refetch.mockReset();
  });

  it('lists an upcoming phase’s sessions with their exercises and prescriptions', async () => {
    renderPage('phasetwoxxxx', { data: memberProgramme() });

    expect(screen.getByRole('heading', { name: 'Building Up — Sessions' })).toBeTruthy();
    expect(screen.getByText('Adds a little more load.').textContent).toBe(
      'Adds a little more load.'
    );
    expect(screen.getByText('Upcoming').textContent).toBe('Upcoming');

    await userEvent.click(screen.getByRole('button', { name: /Session 1/ }));

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
});
