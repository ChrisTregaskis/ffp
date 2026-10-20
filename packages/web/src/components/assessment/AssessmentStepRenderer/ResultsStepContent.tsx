import { useCallback, useEffect } from 'react';

import { ErrorRetryState } from '@web/components/molecules';
import { ASSESSMENT_ACTION } from '@web/contexts/assessments/constants';
import { useAssessment } from '@web/contexts/assessments/useAssessment';
import { useAcknowledgeSafetyAdvice, useAssessmentResultsQuery } from '@web/hooks/assessments';

import { ResultsScreen } from '../screens/ResultsScreen';
import { SafetyConsentScreen } from '../screens/SafetyConsentScreen';

import type { ResultsStepContentProps } from './types';

/**
 * Wires ResultsScreen to the assessment results polling hook. While the member's
 * answers have raised safety advice they have not yet acknowledged, the advice and
 * its consent tick stand in for the result, on every visit and resume until then.
 */
export const ResultsStepContent: React.FC<ResultsStepContentProps> = ({
  config,
  assessmentId,
  onViewProgramme,
  onKeepProgramme,
  onReplaceProgramme,
  isReassessment = false,
  isReplacing = false,
}) => {
  const { assessmentDispatch } = useAssessment();
  const {
    data: results,
    isLoading,
    error,
    refetch,
  } = useAssessmentResultsQuery(assessmentId ?? '');
  const {
    mutate: acknowledge,
    isPending: isAcknowledging,
    isError: isAcknowledgeError,
  } = useAcknowledgeSafetyAdvice();

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

  const handleKeepProgramme = useCallback(() => {
    onKeepProgramme?.();
  }, [onKeepProgramme]);

  const handleReplaceProgramme = useCallback(() => {
    onReplaceProgramme?.();
  }, [onReplaceProgramme]);

  const handleRetry = useCallback(() => {
    void refetch();
  }, [refetch]);

  const handleConfirmSafetyAdvice = useCallback(() => {
    if (assessmentId) {
      acknowledge(assessmentId);
    }
  }, [acknowledge, assessmentId]);

  const safetyGate = results?.safetyGate;

  if (safetyGate?.required && !safetyGate.acknowledgedAt) {
    return (
      <SafetyConsentScreen
        advice={safetyGate.advice ?? ''}
        onConfirm={handleConfirmSafetyAdvice}
        isConfirming={isAcknowledging}
        errorMessage={
          isAcknowledgeError ? "We couldn't save that just now. Please try again." : undefined
        }
      />
    );
  }

  // Polling stops on a persistent error, so without scores the loader would spin forever
  if (error && !results?.scores) {
    return (
      <ErrorRetryState title="We couldn't load your results just now." onRetry={handleRetry} />
    );
  }

  return (
    <ResultsScreen
      config={config}
      scores={results?.scores ?? null}
      isLoading={isLoading || !results?.scores}
      programmeId={results?.programmeId ?? null}
      programmeName={results?.programmeName}
      onViewProgramme={handleViewProgramme}
      isReassessment={isReassessment}
      onKeepProgramme={handleKeepProgramme}
      onReplaceProgramme={handleReplaceProgramme}
      isReplacing={isReplacing}
    />
  );
};
