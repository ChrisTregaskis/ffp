import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ApiError } from '@web/lib/api/client';

import { ProgrammePage } from './ProgrammePage';

const { useProgrammeDetailQuery } = vi.hoisted(() => ({ useProgrammeDetailQuery: vi.fn() }));

vi.mock('@web/hooks/programmes', () => ({ useProgrammeDetailQuery }));

const renderPage = (): void => {
  render(
    <MemoryRouter>
      <ProgrammePage />
    </MemoryRouter>
  );
};

describe('ProgrammePage', () => {
  const refetch = vi.fn();

  beforeEach(() => {
    refetch.mockReset();
  });

  it('keeps loading, not empty, while the query is pending without data or error', () => {
    useProgrammeDetailQuery.mockReturnValue({ isPending: true, error: null, refetch });

    renderPage();

    expect(screen.getByText('Loading your programme...')).toBeTruthy();
    expect(screen.queryByText('No active programme')).toBeNull();
  });

  it('shows the empty programme state when there is no active programme', () => {
    useProgrammeDetailQuery.mockReturnValue({
      isPending: false,
      error: new ApiError(404, 'NOT_FOUND', 'Active programme not found'),
      refetch,
    });

    renderPage();

    expect(screen.getByText('No active programme')).toBeTruthy();
  });

  it('shows an error with a retry when the programme fails to load', async () => {
    useProgrammeDetailQuery.mockReturnValue({
      isPending: false,
      error: new ApiError(503, 'SERVICE_UNAVAILABLE', 'Unavailable'),
      refetch,
    });

    renderPage();

    expect(screen.queryByText('No active programme')).toBeNull();
    await userEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(refetch).toHaveBeenCalledTimes(1);
  });
});
