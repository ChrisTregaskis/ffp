import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import type { AssessmentResultsResponse, SafetyGate } from '@web/lib/api/endpoints/assessments';
import { assessmentKeys } from '@web/lib/query';

import { useAcknowledgeSafetyAdvice } from './useAcknowledgeSafetyAdvice';

import type { ReactNode } from 'react';

const mocks = vi.hoisted(() => ({ acknowledgeSafetyAdvice: vi.fn() }));

vi.mock('@web/lib/api', () => ({ assessmentsApi: mocks }));

const PENDING_GATE: SafetyGate = { required: true, acknowledgedAt: null, advice: 'Advice' };
const ACKNOWLEDGED_GATE: SafetyGate = {
  ...PENDING_GATE,
  acknowledgedAt: '2026-10-16T09:00:00.000Z',
};

const results = (safetyGate: SafetyGate): AssessmentResultsResponse => ({
  status: 'submitted',
  scores: null,
  programmeId: null,
  programmeName: null,
  programmeReadiness: 'pending',
  safetyGate,
});

describe('useAcknowledgeSafetyAdvice', () => {
  it('keeps the acknowledgement when a results poll started earlier lands after it', async () => {
    const queryClient = new QueryClient();
    const key = assessmentKeys.results('assessment-1');
    let resolveStalePoll: (value: AssessmentResultsResponse) => void = () => undefined;

    queryClient.setQueryData(key, results(PENDING_GATE));
    const stalePoll = queryClient
      .fetchQuery({
        queryKey: key,
        queryFn: () =>
          new Promise<AssessmentResultsResponse>((resolve) => {
            resolveStalePoll = resolve;
          }),
      })
      .catch(() => undefined);
    mocks.acknowledgeSafetyAdvice.mockResolvedValue(ACKNOWLEDGED_GATE);

    const wrapper = ({ children }: { children: ReactNode }): JSX.Element => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
    const { result } = renderHook(() => useAcknowledgeSafetyAdvice(), { wrapper });

    result.current.mutate('assessment-1');
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
    resolveStalePoll(results(PENDING_GATE));
    await stalePoll;

    expect(queryClient.getQueryData<AssessmentResultsResponse>(key)?.safetyGate).toEqual(
      ACKNOWLEDGED_GATE
    );
  });
});
