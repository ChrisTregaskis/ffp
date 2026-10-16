import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { ResultsStepContent } from './ResultsStepContent';

const { useAssessmentResultsQuery } = vi.hoisted(() => ({ useAssessmentResultsQuery: vi.fn() }));

vi.mock('@web/hooks/assessments', () => ({ useAssessmentResultsQuery }));
vi.mock('@web/contexts/assessments/useAssessment', () => ({
  useAssessment: () => ({ assessmentDispatch: vi.fn() }),
}));

describe('ResultsStepContent', () => {
  it('shows an error with a retry, instead of loading forever, when the results fail', async () => {
    const refetch = vi.fn();
    useAssessmentResultsQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('Network error'),
      refetch,
    });

    render(<ResultsStepContent config={{ title: 'Your results' }} assessmentId="assessment-1" />);

    expect(screen.getByText("We couldn't load your results just now.")).toBeTruthy();
    await userEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(refetch).toHaveBeenCalledTimes(1);
  });
});
