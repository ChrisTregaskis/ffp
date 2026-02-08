import { useCallback } from 'react';

import { useAssessmentResultsQuery } from '@web/hooks/assessments';

import { ResultsScreen } from '../screens/ResultsScreen';

import type { ResultsStepContentProps } from './types';

/** Wires ResultsScreen to the assessment results polling hook. */
export const ResultsStepContent: React.FC<ResultsStepContentProps> = ({
  config,
  assessmentId,
  onViewProgramme,
}) => {
  const { data: results, isLoading } = useAssessmentResultsQuery(assessmentId ?? '');

  const handleViewProgramme = useCallback(() => {
    onViewProgramme?.();
  }, [onViewProgramme]);

  return (
    <ResultsScreen
      config={config}
      scores={results?.scores ?? null}
      isLoading={isLoading || !results?.scores}
      programmeId={results?.programmeId ?? null}
      onViewProgramme={handleViewProgramme}
    />
  );
};
