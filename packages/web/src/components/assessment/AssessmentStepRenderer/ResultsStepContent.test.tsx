import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { AssessmentResultsResponse, SafetyGate } from '@web/lib/api/endpoints/assessments';

import { ResultsStepContent } from './ResultsStepContent';

import type { ResultsStepContentProps } from './types';

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

const scoredResults = (
  safetyGate: SafetyGate,
  programmeReadiness: AssessmentResultsResponse['programmeReadiness'] = 'ready'
): AssessmentResultsResponse => ({
  status: programmeReadiness === 'ready' ? 'completed' : 'scored',
  scores: {
    dimensions: [],
    scoredAt: new Date(),
  } as unknown as AssessmentResultsResponse['scores'],
  programmeId: programmeReadiness === 'ready' ? 'programme-1' : null,
  programmeReadiness,
  programmeName: 'Level 1: Gentle Mobility',
  safetyGate,
});

const renderResults = (props: Partial<ResultsStepContentProps> = {}): void => {
  render(
    <QueryClientProvider
      client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
    >
      <ResultsStepContent
        config={{ title: 'Your results' }}
        assessmentId="assessment-1"
        {...props}
      />
    </QueryClientProvider>
  );
};

const CONSENT = 'I have spoken to a health professional';
const CONTINUE = 'See my results';
const RESULTS_HEADING = 'Assessment Complete!';
const VIEW_PROGRAMME = 'View My Programme';
const REPLACE_PROGRAMME = 'Replace My Programme';
const KEEP_PROGRAMME = 'Keep Current Programme';

describe('ResultsStepContent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
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

  it('offers the programme once it is ready, without a reload, after the scores arrive', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    mocks.getResults
      .mockResolvedValueOnce(scoredResults(NO_GATE, 'pending'))
      .mockResolvedValue(scoredResults(NO_GATE, 'ready'));

    renderResults();

    const viewProgramme = await screen.findByRole('button', { name: VIEW_PROGRAMME });

    expect(viewProgramme).toHaveProperty('disabled', true);
    await act(() => vi.advanceTimersByTimeAsync(2000));
    expect(viewProgramme).toHaveProperty('disabled', false);
  });

  it('offers a retry in place of the programme button when checking on the programme fails', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    mocks.getResults
      .mockResolvedValueOnce(scoredResults(NO_GATE, 'pending'))
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValue(scoredResults(NO_GATE, 'ready'));

    renderResults();

    expect(await screen.findByRole('button', { name: VIEW_PROGRAMME })).toBeTruthy();
    await act(() => vi.advanceTimersByTimeAsync(2000));

    expect(await screen.findByText("We couldn't check on your programme just now.")).toBeTruthy();
    expect(screen.queryByRole('button', { name: VIEW_PROGRAMME })).toBeNull();
    // The scores already shown stay in place
    expect(screen.getByText(RESULTS_HEADING)).toBeTruthy();

    await userEvent.click(screen.getByRole('button', { name: 'Try again' }));

    expect(await screen.findByRole('button', { name: VIEW_PROGRAMME })).toHaveProperty(
      'disabled',
      false
    );
  });

  it('polls again after a retry that finds the programme still being put together', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    mocks.getResults
      .mockResolvedValueOnce(scoredResults(NO_GATE, 'pending'))
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValueOnce(scoredResults(NO_GATE, 'pending'))
      .mockResolvedValue(scoredResults(NO_GATE, 'ready'));

    renderResults();

    await screen.findByRole('button', { name: VIEW_PROGRAMME });
    await act(() => vi.advanceTimersByTimeAsync(2000));
    await userEvent.click(await screen.findByRole('button', { name: 'Try again' }));

    const viewProgramme = await screen.findByRole('button', { name: VIEW_PROGRAMME });

    expect(viewProgramme).toHaveProperty('disabled', true);
    await act(() => vi.advanceTimersByTimeAsync(2000));
    expect(viewProgramme).toHaveProperty('disabled', false);
  });

  it('shows a calm notice instead of the programme button when it could not be put together', async () => {
    mocks.getResults.mockResolvedValue(scoredResults(NO_GATE, 'failed'));

    renderResults();

    expect(await screen.findByText('Your programme is not quite ready')).toBeTruthy();
    expect(screen.queryByRole('button', { name: VIEW_PROGRAMME })).toBeNull();
  });

  it('keeps the current programme to hand, with a calm notice, when replacing it fails', async () => {
    mocks.getResults.mockResolvedValue(scoredResults(NO_GATE));

    renderResults({ isReassessment: true, hasReplaceFailed: true });

    expect(
      await screen.findByText(
        "We couldn't update your programme just now. Your current programme is still here for you."
      )
    ).toBeTruthy();
    expect(screen.getByRole('button', { name: REPLACE_PROGRAMME })).toHaveProperty(
      'disabled',
      true
    );
    expect(screen.getByRole('button', { name: KEEP_PROGRAMME })).toHaveProperty('disabled', false);
  });
});
