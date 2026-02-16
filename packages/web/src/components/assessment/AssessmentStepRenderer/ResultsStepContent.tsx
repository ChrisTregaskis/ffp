import { useCallback, useEffect } from 'react';

import { ASSESSMENT_ACTION } from '@web/contexts/assessments/constants';
import { useAssessment } from '@web/contexts/assessments/useAssessment';
import { useAssessmentResultsQuery } from '@web/hooks/assessments';

import { ResultsScreen } from '../screens/ResultsScreen';

import type { ResultsStepContentProps } from './types';

/** Wires ResultsScreen to the assessment results polling hook. */
export const ResultsStepContent: React.FC<ResultsStepContentProps> = ({
  config,
  assessmentId,
  onViewProgramme,
}) => {
  const { assessmentDispatch } = useAssessment();
  const { data: results, isLoading } = useAssessmentResultsQuery(assessmentId ?? '');

  // Sync polled scores into assessment context state
  useEffect(() => {
    if (results?.scores) {
      assessmentDispatch({
        type: ASSESSMENT_ACTION.SET_SCORES,
        payload: { scores: results.scores },
      });
    }
  }, [results?.scores, assessmentDispatch]);

  const handleViewProgramme = useCallback(() => {
    onViewProgramme?.();
  }, [onViewProgramme]);

  return (
    <ResultsScreen
      config={config}
      scores={results?.scores ?? null}
      isLoading={isLoading || !results?.scores}
      programmeId={results?.programmeId ?? null}
      programmeName={results?.programmeName}
      onViewProgramme={handleViewProgramme}
    />
  );
};
