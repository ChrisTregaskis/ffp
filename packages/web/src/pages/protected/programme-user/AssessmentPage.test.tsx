import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ApiError } from '@web/lib/api/client';

import { AssessmentPage } from './AssessmentPage';

import type { ReactNode } from 'react';

const { useUserAssessmentStatusQuery } = vi.hoisted(() => ({
  useUserAssessmentStatusQuery: vi.fn(),
}));

vi.mock('@web/hooks/assessments', () => ({ useUserAssessmentStatusQuery }));
vi.mock('@web/contexts/assessments/AssessmentProvider', () => ({
  AssessmentProvider: ({ children }: { children: ReactNode }) => children,
}));
vi.mock('./AssessmentOrchestrator', () => ({
  AssessmentOrchestrator: () => <p>Assessment started</p>,
}));

const renderPage = (): void => {
  render(
    <MemoryRouter initialEntries={['/assessment?flowId=flow-1']}>
      <AssessmentPage />
    </MemoryRouter>
  );
};

describe('AssessmentPage', () => {
  const refetch = vi.fn();

  beforeEach(() => {
    refetch.mockReset();
  });

  it('waits, without starting, while the status is pending without data or error', () => {
    useUserAssessmentStatusQuery.mockReturnValue({ isPending: true, error: null, refetch });

    renderPage();

    expect(screen.queryByText('Assessment started')).toBeNull();
  });

  it('shows an error with a retry, without starting, when the status fails to load', async () => {
    useUserAssessmentStatusQuery.mockReturnValue({
      isPending: false,
      error: new ApiError(500, 'INTERNAL_ERROR', 'Something broke'),
      refetch,
    });

    renderPage();

    expect(screen.getByText("We couldn't load your assessment just now.")).toBeTruthy();
    expect(screen.queryByText('Assessment started')).toBeNull();
    await userEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(refetch).toHaveBeenCalledTimes(1);
  });

  it('starts the assessment once the status shows no programme', () => {
    useUserAssessmentStatusQuery.mockReturnValue({
      isPending: false,
      error: null,
      data: { hasProgramme: false },
      refetch,
    });

    renderPage();

    expect(screen.getByText('Assessment started')).toBeTruthy();
  });
});
