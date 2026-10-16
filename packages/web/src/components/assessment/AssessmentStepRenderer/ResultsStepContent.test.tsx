import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { AssessmentResultsResponse, SafetyGate } from '@web/lib/api/endpoints/assessments';

import { ResultsStepContent } from './ResultsStepContent';

const mocks = vi.hoisted(() => ({ getResults: vi.fn(), acknowledgeSafetyAdvice: vi.fn() }));

vi.mock('@web/lib/api', () => ({ assessmentsApi: mocks }));
vi.mock('@web/contexts/assessments/useAssessment', () => ({
  useAssessment: () => ({ assessmentDispatch: vi.fn() }),
}));

const ADVICE = 'Please speak to a health professional before you start.';
const NO_GATE: SafetyGate = { required: false, acknowledgedAt: null, advice: null };
const PENDING_GATE: SafetyGate = { required: true, acknowledgedAt: null, advice: ADVICE };
const ACKNOWLEDGED_GATE: SafetyGate = {
  ...PENDING_GATE,
  acknowledgedAt: '2026-10-16T09:00:00.000Z',
};

const scoredResults = (safetyGate: SafetyGate): AssessmentResultsResponse => ({
  status: 'completed',
  scores: {
    dimensions: [],
    scoredAt: new Date(),
  } as unknown as AssessmentResultsResponse['scores'],
  programmeId: 'programme-1',
  programmeName: 'Level 1: Gentle Mobility',
  safetyGate,
});

const renderResults = (): void => {
  render(
    <QueryClientProvider
      client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
    >
      <ResultsStepContent config={{ title: 'Your results' }} assessmentId="assessment-1" />
    </QueryClientProvider>
  );
};

const CONSENT = 'I have spoken to a health professional';
const CONTINUE = 'See my results';
const RESULTS_HEADING = 'Assessment Complete!';

describe('ResultsStepContent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows an error with a retry, instead of loading forever, when the results fail', async () => {
    mocks.getResults.mockRejectedValue(new Error('Network error'));

    renderResults();

    expect(await screen.findByText("We couldn't load your results just now.")).toBeTruthy();
    await userEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(mocks.getResults).toHaveBeenCalledTimes(2);
  });

  it('holds the result behind the advice until the member ticks and continues', async () => {
    mocks.getResults.mockResolvedValue(scoredResults(PENDING_GATE));
    mocks.acknowledgeSafetyAdvice.mockResolvedValue(ACKNOWLEDGED_GATE);

    renderResults();

    expect(await screen.findByText(ADVICE)).toBeTruthy();
    expect(screen.queryByText(RESULTS_HEADING)).toBeNull();

    const continueButton = screen.getByRole('button', { name: CONTINUE });

    expect(continueButton).toHaveProperty('disabled', true);

    await userEvent.click(screen.getByLabelText(CONSENT));
    expect(continueButton).toHaveProperty('disabled', false);

    await userEvent.click(continueButton);

    expect(mocks.acknowledgeSafetyAdvice).toHaveBeenCalledWith('assessment-1');
    expect(await screen.findByText(RESULTS_HEADING)).toBeTruthy();
    expect(screen.queryByText(ADVICE)).toBeNull();
  });

  it('keeps the member on the advice, with a message, when the confirmation fails', async () => {
    mocks.getResults.mockResolvedValue(scoredResults(PENDING_GATE));
    mocks.acknowledgeSafetyAdvice.mockRejectedValue(new Error('Network error'));

    renderResults();

    await userEvent.click(await screen.findByLabelText(CONSENT));
    await userEvent.click(screen.getByRole('button', { name: CONTINUE }));

    expect(
      await screen.findByText("We couldn't save that just now. Please try again.")
    ).toBeTruthy();
    expect(screen.queryByText(RESULTS_HEADING)).toBeNull();
  });

  it.each([
    ['a member who has already consented, on resume', ACKNOWLEDGED_GATE],
    ['a member whose answers raised no advice', NO_GATE],
  ])('shows the result straight away to %s', async (_, safetyGate) => {
    mocks.getResults.mockResolvedValue(scoredResults(safetyGate));

    renderResults();

    expect(await screen.findByText(RESULTS_HEADING)).toBeTruthy();
    expect(screen.queryByText(CONSENT)).toBeNull();
  });
});
