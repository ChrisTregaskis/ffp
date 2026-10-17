import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ApiError } from '@web/lib/api/client';

import { DashboardPage } from './DashboardPage';

const { useProgrammeDetailQuery, useProgressSummaryQuery } = vi.hoisted(() => ({
  useProgrammeDetailQuery: vi.fn(),
  useProgressSummaryQuery: vi.fn(),
}));

vi.mock('@web/hooks/programmes', () => ({ useProgrammeDetailQuery, useProgressSummaryQuery }));
vi.mock('@web/hooks/users', () => ({ useUserProfileQuery: () => ({ data: undefined }) }));

const failedQuery = (error: Error, refetch = vi.fn()): Record<string, unknown> => ({
  data: undefined,
  isPending: false,
  error,
  refetch,
});

const renderDashboard = (): void => {
  render(
    <MemoryRouter>
      <DashboardPage />
    </MemoryRouter>
  );
};

describe('DashboardPage', () => {
  beforeEach(() => {
    useProgrammeDetailQuery.mockReset();
    useProgressSummaryQuery.mockReset();
  });

  it('keeps loading, not empty, while a query is pending without data or error', () => {
    const pending = { data: undefined, isPending: true, error: null, refetch: vi.fn() };
    useProgrammeDetailQuery.mockReturnValue(pending);
    useProgressSummaryQuery.mockReturnValue(pending);

    renderDashboard();

    expect(screen.getByText('Loading your dashboard...')).toBeTruthy();
    expect(screen.queryByText('No active programme')).toBeNull();
  });

  it('shows the empty programme state when there is no active programme', () => {
    const notFound = new ApiError(404, 'NOT_FOUND', 'Active programme not found');
    useProgrammeDetailQuery.mockReturnValue(failedQuery(notFound));
    useProgressSummaryQuery.mockReturnValue(failedQuery(notFound));

    renderDashboard();

    expect(screen.getByText('No active programme')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Try again' })).toBeNull();
  });

  it('shows an error with a retry of both queries when the programme fails to load', async () => {
    const refetchDetail = vi.fn();
    const refetchProgress = vi.fn();
    useProgrammeDetailQuery.mockReturnValue(
      failedQuery(new ApiError(500, 'INTERNAL_ERROR', 'Something broke'), refetchDetail)
    );
    useProgressSummaryQuery.mockReturnValue(failedQuery(ApiError.timeoutError(), refetchProgress));

    renderDashboard();

    expect(screen.getByText("We couldn't load your programme just now.")).toBeTruthy();
    expect(screen.queryByText('No active programme')).toBeNull();

    await userEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(refetchDetail).toHaveBeenCalledTimes(1);
    expect(refetchProgress).toHaveBeenCalledTimes(1);
  });
});
