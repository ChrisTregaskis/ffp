import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createInitialState } from '@web/contexts/assessments/helpers';
import { ApiError } from '@web/lib/api';

import { AssessmentOrchestrator } from './AssessmentOrchestrator';

const mocks = vi.hoisted(() => ({
  useAssessment: vi.fn(),
  useAssessmentTemplateQuery: vi.fn(),
  useStartAssessment: vi.fn(),
  useSubmitAssessment: vi.fn(),
  showRefusedAnswers: vi.fn(() => Promise.resolve(true)),
}));

vi.mock('@web/contexts/assessments/useAssessment', () => ({ useAssessment: mocks.useAssessment }));
vi.mock('@web/hooks/assessments', () => ({
  useAssessmentTemplateQuery: mocks.useAssessmentTemplateQuery,
  useStartAssessment: mocks.useStartAssessment,
  useSubmitAssessment: mocks.useSubmitAssessment,
  useShowRefusedAnswers: () => mocks.showRefusedAnswers,
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
  state: { isPending?: boolean; isError?: boolean; error?: unknown; variables?: unknown } = {}
): Record<string, unknown> => ({
  mutate,
  isPending: false,
  isError: false,
  error: state.isError ? new Error('Network error') : null,
  ...state,
});

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

  it('takes the member back to a refused answer instead of the failure screen', async () => {
    const questionId = '3ad90ada-14f9-4883-a502-56dc6cf73ab1';
    const refusal = new ApiError(400, 'VALIDATION_ERROR', 'Some answers need your attention', [
      { path: `answers.${questionId}`, code: 'required', message: 'Please answer this question.' },
    ]);
    mocks.useSubmitAssessment.mockImplementation((options: { onError: (e: unknown) => void }) => {
      options.onError(refusal);

      return mutation(submitMutate, { isError: true, error: refusal });
    });

    renderOrchestrator();

    expect(mocks.showRefusedAnswers).toHaveBeenCalledWith({
      [questionId]: 'Please answer this question.',
    });
    // Judge the screen only once the refusal has been shown and its outcome has landed
    await act(async () => {
      await mocks.showRefusedAnswers.mock.results.at(-1)?.value;
    });
    expect(screen.queryByText("We couldn't send your answers just now.")).toBeNull();
    expect(screen.getByText('Step')).toBeTruthy();
  });

  it('shows the failure screen when a refusal names no question the flow shows', async () => {
    const refusal = new ApiError(400, 'VALIDATION_ERROR', 'Some answers need your attention', [
      { path: 'answers.q-unknown', code: 'unknown_question', message: 'Not in this assessment.' },
    ]);
    mocks.showRefusedAnswers.mockResolvedValue(false);
    mocks.useSubmitAssessment.mockImplementation((options: { onError: (e: unknown) => void }) => {
      options.onError(refusal);

      return mutation(submitMutate, { isError: true, error: refusal });
    });

    renderOrchestrator();

    expect(await screen.findByText("We couldn't send your answers just now.")).toBeTruthy();
  });

  it('shows the server’s own words for a refusal naming no question', () => {
    const refusal = new ApiError(
      400,
      'VALIDATION_ERROR',
      'Please answer the questions before you submit your assessment.'
    );
    mocks.useSubmitAssessment.mockReturnValue(
      mutation(submitMutate, { isError: true, error: refusal })
    );

    renderOrchestrator();

    expect(
      screen.getByText('Please answer the questions before you submit your assessment.')
    ).toBeTruthy();
    expect(screen.queryByText("We couldn't send your answers just now.")).toBeNull();
  });

  it('leads back to the questions from a worded refusal rather than sending the answers again', async () => {
    const refusal = new ApiError(
      400,
      'VALIDATION_ERROR',
      'Please answer the questions before you submit your assessment.'
    );
    const reset = vi.fn();
    mocks.useSubmitAssessment.mockReturnValue({
      ...mutation(submitMutate, { isError: true, error: refusal }),
      reset,
    });

    renderOrchestrator();
    await userEvent.click(screen.getByRole('button', { name: 'Back to the questions' }));

    expect(reset).toHaveBeenCalledTimes(1);
    expect(submitMutate).not.toHaveBeenCalled();
  });
});
