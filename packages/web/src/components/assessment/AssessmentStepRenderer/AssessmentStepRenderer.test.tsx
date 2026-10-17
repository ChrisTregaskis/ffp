import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { createInitialState } from '@web/contexts/assessments/helpers';

import { AssessmentStepRenderer } from './AssessmentStepRenderer';

const { useAssessmentFlowQuery } = vi.hoisted(() => ({ useAssessmentFlowQuery: vi.fn() }));

vi.mock('@web/hooks/assessments', () => ({ useAssessmentFlowQuery }));
vi.mock('@web/contexts/assessments/useAssessment', () => ({
  useAssessment: () => ({
    assessmentState: {
      ...createInitialState('flow-1'),
      currentStepId: 'step-1',
      steps: [{ id: 'step-1', order: 1, type: 'intro', config: { title: 'Welcome' } }],
    },
    assessmentDispatch: vi.fn(),
  }),
}));

describe('AssessmentStepRenderer', () => {
  it('shows an error with a retry, not the step, when the flow fails to load', async () => {
    const refetch = vi.fn();
    useAssessmentFlowQuery.mockReturnValue({
      data: undefined,
      isPending: false,
      error: new Error('Network error'),
      refetch,
    });

    render(<AssessmentStepRenderer />);

    expect(screen.getByText("We couldn't load your assessment just now.")).toBeTruthy();
    await userEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(refetch).toHaveBeenCalledTimes(1);
  });

  it('keeps loading while the flow is pending without data or error', () => {
    useAssessmentFlowQuery.mockReturnValue({
      data: undefined,
      isPending: true,
      error: null,
      refetch: vi.fn(),
    });

    render(<AssessmentStepRenderer />);

    expect(screen.getByText('Loading assessment...')).toBeTruthy();
  });
});
