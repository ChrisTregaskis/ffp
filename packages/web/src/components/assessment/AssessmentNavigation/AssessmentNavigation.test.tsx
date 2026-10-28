import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createInitialState } from '@web/contexts/assessments/helpers';
import { ApiError } from '@web/lib/api';

import { AssessmentNavigation } from './AssessmentNavigation';

const save = vi.hoisted(() => ({ mutateAsync: vi.fn() }));

vi.mock('@web/contexts/assessments/useAssessment', () => ({
  useAssessment: () => ({
    assessmentState: {
      ...createInitialState('flow-1'),
      assessmentId: 'assessment-1',
      currentStep: 2,
    },
    assessmentDispatch: vi.fn(),
  }),
}));
// A refusal naming no question has nothing to show on one
vi.mock('@web/hooks/assessments/useShowRefusedAnswers', () => ({
  useShowRefusedAnswers: () => () => Promise.resolve(false),
}));
vi.mock('@web/hooks/assessments/useSaveProgress', () => ({
  useSaveProgress: () => ({ mutateAsync: save.mutateAsync, isPending: false }),
}));

const GENERIC_FAILURE = "We couldn't save your answers just now. Please try again.";

const continueAndFailWith = async (error: unknown): Promise<HTMLElement> => {
  save.mutateAsync.mockRejectedValue(error);
  render(<AssessmentNavigation />);
  fireEvent.click(screen.getByRole('button', { name: /Continue/ }));

  return await screen.findByRole('alert');
};

describe('AssessmentNavigation', () => {
  beforeEach(() => {
    save.mutateAsync.mockReset();
  });

  it("shows the server's message for a refused save that names no question", async () => {
    const alert = await continueAndFailWith(
      new ApiError(400, 'VALIDATION_ERROR', 'This step is not part of the assessment.', {
        currentStep: 2,
      })
    );

    expect(alert.textContent).toBe('This step is not part of the assessment.');
  });

  it('keeps the generic message for a server failure', async () => {
    const alert = await continueAndFailWith(
      new ApiError(500, 'INTERNAL_SERVER_ERROR', 'An unexpected error occurred')
    );

    expect(alert.textContent).toBe(GENERIC_FAILURE);
  });

  it('keeps the generic message when the network fails', async () => {
    const alert = await continueAndFailWith(ApiError.networkError(new Error('Failed to fetch')));

    expect(alert.textContent).toBe(GENERIC_FAILURE);
  });
});
