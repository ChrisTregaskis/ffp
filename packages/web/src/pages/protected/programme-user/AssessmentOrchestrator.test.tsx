import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createInitialState } from '@web/contexts/assessments/helpers';

import { AssessmentOrchestrator } from './AssessmentOrchestrator';

const mocks = vi.hoisted(() => ({
  useAssessment: vi.fn(),
  useAssessmentTemplateQuery: vi.fn(),
  useStartAssessment: vi.fn(),
  useSubmitAssessment: vi.fn(),
}));

vi.mock('@web/contexts/assessments/useAssessment', () => ({ useAssessment: mocks.useAssessment }));
vi.mock('@web/hooks/assessments', () => ({
  useAssessmentTemplateQuery: mocks.useAssessmentTemplateQuery,
  useStartAssessment: mocks.useStartAssessment,
  useSubmitAssessment: mocks.useSubmitAssessment,
}));
vi.mock('@web/hooks/programmes', () => ({
  useReplaceProgrammeMutation: () => ({ mutate: vi.fn(), isPending: false }),
}));
vi.mock('@web/components/assessment/AssessmentStepRenderer/AssessmentStepRenderer', () => ({
  AssessmentStepRenderer: () => <p>Step</p>,
}));

const startMutate = vi.fn();
const submitMutate = vi.fn();
const refetchTemplate = vi.fn();

const mutation = (
  mutate: () => void,
  state: { isPending?: boolean; isError?: boolean; variables?: unknown } = {}
): Record<string, unknown> => ({ mutate, isPending: false, isError: false, ...state });

const renderOrchestrator = (): void => {
  render(
    <MemoryRouter>
      <AssessmentOrchestrator flowId="flow-1" />
    </MemoryRouter>
  );
};

describe('AssessmentOrchestrator', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.useAssessment.mockReturnValue({
      assessmentState: {
        ...createInitialState('flow-1'),
        assessmentId: 'assessment-1',
        currentStepId: 'step-1',
        steps: [{ id: 'step-1', order: 1, type: 'questions', templateId: 'template-1' }],
        phase: 'questions',
      },
      assessmentDispatch: vi.fn(),
    });
    mocks.useAssessmentTemplateQuery.mockReturnValue({
      data: { templateQuestions: [] },
      error: null,
      refetch: refetchTemplate,
    });
    mocks.useStartAssessment.mockReturnValue(mutation(startMutate));
    mocks.useSubmitAssessment.mockReturnValue(mutation(submitMutate));
  });

  it('retries a failed start with the arguments it was first made with', async () => {
    const variables = { flowId: 'flow-1', isReassessment: true };
    mocks.useStartAssessment.mockReturnValue(mutation(startMutate, { isError: true, variables }));

    renderOrchestrator();
    startMutate.mockClear();

    expect(screen.getByText("We couldn't load your assessment just now.")).toBeTruthy();
    await userEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(startMutate).toHaveBeenCalledWith(variables);
  });

  it('offers to fetch the questions again when they fail to load', async () => {
    mocks.useAssessmentTemplateQuery.mockReturnValue({
      data: undefined,
      error: new Error('Network error'),
      refetch: refetchTemplate,
    });

    renderOrchestrator();

    expect(screen.getByText("We couldn't load the questions just now.")).toBeTruthy();
    await userEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(refetchTemplate).toHaveBeenCalledTimes(1);
  });

  it('offers to send the answers again when submitting fails', async () => {
    mocks.useSubmitAssessment.mockReturnValue(mutation(submitMutate, { isError: true }));

    renderOrchestrator();

    expect(screen.getByText("We couldn't send your answers just now.")).toBeTruthy();
    await userEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(submitMutate).toHaveBeenCalledWith({
      assessmentId: 'assessment-1',
      payload: { answers: {} },
    });
  });
});
