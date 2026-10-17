import { hashKey, keepPreviousData, useQuery } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';

import type { ScoringDryRunRequest, ScoringDryRunResult } from '@ffp/core';

import { adminAssessmentFlowsApi } from '@web/lib/api/endpoints';
import { assessmentFlowKeys } from '@web/lib/query/keys';

import type { UseQueryResult } from '@tanstack/react-query';

const DRY_RUN_DEBOUNCE_MS = 300;

type DryRunAnswers = ScoringDryRunRequest['answers'];

/** `answers` are the ones scored, which can trail those on screen */
export interface ScoredDryRun {
  result: ScoringDryRunResult;
  answers: DryRunAnswers;
}

export type FlowScoringDryRunQueryResult = UseQueryResult<ScoredDryRun> & {
  isSettling: boolean;
};

export const useFlowScoringDryRunQuery = (
  publicId: string,
  answers: DryRunAnswers
): FlowScoringDryRunQueryResult => {
  const [debouncedAnswers, setDebouncedAnswers] = useState(answers);
  // By value: an equal array rebuilt each render must not restart the debounce
  const answersKey = hashKey([answers]);
  const latestAnswers = useRef(answers);
  latestAnswers.current = answers;

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedAnswers(latestAnswers.current);
    }, DRY_RUN_DEBOUNCE_MS);

    return () => {
      clearTimeout(timer);
    };
  }, [answersKey]);

  const query = useQuery({
    queryKey: assessmentFlowKeys.scoringDryRun(publicId, debouncedAnswers),
    queryFn: async ({ signal }): Promise<ScoredDryRun> => ({
      result: await adminAssessmentFlowsApi.dryRunScoring(
        publicId,
        { answers: debouncedAnswers },
        signal
      ),
      answers: debouncedAnswers,
    }),
    enabled: !!publicId,
    placeholderData: keepPreviousData,
    // Option scores change in the question bank, so a result is never fresh
    staleTime: 0,
  });

  const isSettling = hashKey([debouncedAnswers]) !== answersKey || query.isPlaceholderData;

  return { ...query, isSettling };
};
