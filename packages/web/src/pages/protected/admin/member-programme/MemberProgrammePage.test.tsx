import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { userDetailResponseSchema } from '@ffp/core';

import { useUserDetailQuery, useUserProgrammeQuery } from '@web/hooks/users';
import { ApiError } from '@web/lib/api/client';

import { MemberProgrammePage } from './MemberProgrammePage';
import { memberProgramme } from './programme-fixture';

vi.mock('@web/hooks/users', () => ({
  useUserProgrammeQuery: vi.fn(),
  useUserDetailQuery: vi.fn(),
}));

const mockedProgrammeQuery = vi.mocked(useUserProgrammeQuery);
const refetch = vi.fn();

type ProgrammeQuery = ReturnType<typeof useUserProgrammeQuery>;

const renderPage = (query: Partial<ProgrammeQuery>): void => {
  mockedProgrammeQuery.mockReturnValue({
    data: undefined,
    isPending: false,
    error: null,
    refetch,
    ...query,
  } as ProgrammeQuery);

  render(
    <MemoryRouter initialEntries={['/admin/users/sharronxxxxx/programme']}>
      <Routes>
        <Route path="/admin/users/:id/programme" element={<MemberProgrammePage />} />
        <Route path="/admin/users/:id/programme/phases/:phaseId" element={<p>Phase page</p>} />
      </Routes>
    </MemoryRouter>
  );
};

describe('MemberProgrammePage', () => {
  beforeEach(() => {
    mockedProgrammeQuery.mockReset();
    refetch.mockReset();
    vi.mocked(useUserDetailQuery).mockReturnValue({
      data: undefined,
    } as ReturnType<typeof useUserDetailQuery>);
  });

  it('shows the member, and the programme’s status, level, key areas and phases', () => {
    vi.mocked(useUserDetailQuery).mockReturnValue({
      data: userDetailResponseSchema.parse({
        id: crypto.randomUUID(),
        publicId: 'sharronxxxxx',
        organisationId: crypto.randomUUID(),
        email: 'sharron@example.com',
        cognitoSub: 'cognito-sharron',
        firstName: 'Sharron',
        lastName: 'Blain',
        role: 'programme_user',
        locationId: null,
        profileImageUrl: null,
        phone: null,
        dateOfBirth: null,
        createdAt: '2026-10-01T09:00:00Z',
        updatedAt: '2026-10-01T09:00:00Z',
        locationName: null,
      }),
    } as ReturnType<typeof useUserDetailQuery>);
    renderPage({ data: memberProgramme() });

    expect(screen.getByText('Sharron Blain').textContent).toBe('Sharron Blain');

    expect(screen.getByRole('heading', { name: 'Level 1: Gentle Mobility' })).toBeTruthy();
    expect(screen.getByText('Active').textContent).toBe('Active');
    expect(screen.getByText('Level 1').textContent).toBe('Level 1');
    expect(screen.getByText('Which areas would you like to focus on?').textContent).toBe(
      'Which areas would you like to focus on?'
    );
    expect(screen.getByText('Neck & Shoulders').textContent).toBe('Neck & Shoulders');
    expect(screen.getByText('Hips & Lower Body').textContent).toBe('Hips & Lower Body');

    const rows = screen
      .getAllByRole('row')
      .slice(1)
      .map((row) =>
        within(row)
          .getAllByRole('cell')
          .slice(0, 4)
          .map((cell) => cell.textContent)
      );

    expect(rows).toEqual([
      ['1', 'Foundations', 'In Progress', '1 / 2'],
      ['2', 'Building Up', 'Upcoming', '0 / 1'],
    ]);
  });

  it('says when no key areas were recorded', () => {
    renderPage({ data: memberProgramme({ keyAreas: [], level: null }) });

    expect(screen.getByText('No key areas were recorded for this programme.').textContent).toBe(
      'No key areas were recorded for this programme.'
    );
    expect(screen.queryByText('Level 1')).toBeNull();
  });

  it('opens a phase’s sessions from its row', async () => {
    renderPage({ data: memberProgramme() });

    const row = screen.getByText('Building Up').closest('tr');

    if (!row) {
      throw new Error('No row for Building Up');
    }

    await userEvent.click(within(row).getByRole('button', { name: 'Actions' }));
    await userEvent.click(screen.getByRole('menuitem', { name: 'View Sessions' }));

    expect(screen.getByText('Phase page').textContent).toBe('Phase page');
  });

  it('shows a loader while the programme loads', () => {
    renderPage({ isPending: true });

    expect(screen.getByRole('status')).toBeTruthy();
    expect(screen.queryByRole('table')).toBeNull();
  });

  it('offers a retry when the programme fails to load', async () => {
    renderPage({ error: new ApiError(500, 'INTERNAL_ERROR', 'Server error') });

    await userEvent.click(screen.getByRole('button', { name: 'Try again' }));

    expect(refetch).toHaveBeenCalledTimes(1);
    expect(screen.queryByText("This member doesn't have a programme yet.")).toBeNull();
  });

  it('says the member has no programme when the read answers 404', () => {
    renderPage({ error: new ApiError(404, 'NOT_FOUND', 'Active programme not found') });

    expect(screen.getByText("This member doesn't have a programme yet.").textContent).toBe(
      "This member doesn't have a programme yet."
    );
    expect(screen.queryByRole('button', { name: 'Try again' })).toBeNull();
  });
});
