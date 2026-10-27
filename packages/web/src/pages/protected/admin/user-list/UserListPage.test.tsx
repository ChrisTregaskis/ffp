import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { userListResponseSchema, type UserListResponse } from '@ffp/core';

import { useAdminUsersQuery } from '@web/hooks/users';

import { UserListPage } from './UserListPage';

vi.mock('@web/hooks/users', () => ({ useAdminUsersQuery: vi.fn() }));

const mockedUseAdminUsersQuery = vi.mocked(useAdminUsersQuery);

const user = (firstName: string, overrides: Partial<UserListResponse> = {}): UserListResponse =>
  userListResponseSchema.parse({
    id: crypto.randomUUID(),
    publicId: firstName.toLowerCase().padEnd(12, 'x'),
    email: `${firstName.toLowerCase()}@example.com`,
    firstName,
    lastName: 'Member',
    role: 'programme_user',
    locationId: null,
    createdAt: '2026-10-01T09:00:00Z',
    locationName: 'Riverside',
    programmeName: null,
    programmeLevel: null,
    programmeStatus: null,
    generationFailed: false,
    ...overrides,
  });

const renderPage = (users: UserListResponse[]): void => {
  mockedUseAdminUsersQuery.mockReturnValue({
    data: {
      data: users,
      pagination: { page: 1, pageSize: 10, total: users.length, totalPages: 1 },
    },
    isPending: false,
    error: null,
  } as ReturnType<typeof useAdminUsersQuery>);

  render(
    <MemoryRouter>
      <UserListPage />
    </MemoryRouter>
  );
};

/** The text of each cell in the named member's row */
const rowCells = (firstName: string): string[] => {
  const row = screen.getByText(`${firstName} Member`).closest('tr');

  if (!row) {
    throw new Error(`No row for ${firstName}`);
  }

  return within(row)
    .getAllByRole('cell')
    .map((cell) => cell.textContent);
};

describe('UserListPage', () => {
  beforeAll(() => {
    // jsdom has no layout, so the select's highlighted option can't scroll into view
    Element.prototype.scrollIntoView = vi.fn();
  });

  beforeEach(() => {
    mockedUseAdminUsersQuery.mockReset();
  });

  it('shows each member’s programme, level and programme status', () => {
    renderPage([
      user('Mara', {
        programmeName: 'Gentle Mobility',
        programmeLevel: 1,
        programmeStatus: 'active',
      }),
      user('Nina'),
      user('Omar', { generationFailed: true }),
      user('Pia', {
        programmeName: 'Active Wellness',
        programmeLevel: 2,
        programmeStatus: 'active',
        generationFailed: true,
      }),
    ]);

    expect(rowCells('Mara').slice(4, 7)).toEqual(['Gentle Mobility', 'Level 1', 'Active']);
    expect(rowCells('Nina').slice(4, 7)).toEqual(['-', '-', '-']);
    expect(rowCells('Omar').slice(4, 7)).toEqual(['-', '-', 'Generation failed']);
    // A failed regeneration shows even though the member keeps their earlier programme
    expect(rowCells('Pia').slice(4, 7)).toEqual([
      'Active Wellness',
      'Level 2',
      'Generation failed',
    ]);
  });

  it('asks the API to sort by name when the Name column is sorted', async () => {
    renderPage([user('Mara')]);

    await userEvent.click(screen.getByRole('columnheader', { name: /Name/ }));

    // The table debounces its state before the list query sees it
    await waitFor(() => {
      expect(mockedUseAdminUsersQuery.mock.lastCall?.[0]).toMatchObject({
        sortBy: 'fullName',
        sortDirection: 'asc',
      });
    });
  });

  it('sends the Customer Staff filter as the comma-separated role list', async () => {
    renderPage([user('Mara')]);

    await userEvent.click(screen.getByRole('combobox', { name: /Roles/ }));
    await userEvent.click(screen.getByRole('option', { name: 'Customer Staff' }));

    await waitFor(() => {
      expect(mockedUseAdminUsersQuery.mock.lastCall?.[1]).toEqual({
        search: undefined,
        role: 'customer_owner,customer_admin',
      });
    });
  });
});
