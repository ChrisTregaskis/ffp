import React from 'react';
import { Navigate, useSearchParams } from 'react-router-dom';

import { ErrorRetryState, LoadingState, StaticAlert } from '@web/components/molecules';
import { routes, RouteKey } from '@web/config/routes';
import { AssessmentProvider } from '@web/contexts/assessments/AssessmentProvider';
import { useUserAssessmentStatusQuery } from '@web/hooks/assessments';

import { AssessmentOrchestrator } from './AssessmentOrchestrator';

/**
 * Fullscreen assessment page (no app layout or sidebar).
 *
 * Reads `flowId` from URL search params and wraps the assessment
 * flow in AssessmentProvider. Guards against users who already have
 * an active programme — redirects them to the programme overview.
 */
export const AssessmentPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const flowId = searchParams.get('flowId');
  const reassessParam = searchParams.get('reassess') === 'true';
  const {
    data: assessmentStatus,
    isPending: isStatusPending,
    error: statusError,
    refetch: refetchStatus,
  } = useUserAssessmentStatusQuery();

  // Only treat as reassessment if param is set AND user actually has a programme
  const isReassessment = reassessParam && !!assessmentStatus?.hasProgramme;

  // Without the status we can't tell whether the member already has a programme, so don't start
  if (statusError && !assessmentStatus) {
    return (
      <div className="bg-linear-to-br from-gray-50 via-ffp-light-purple/10 to-gray-50">
        <ErrorRetryState
          layout="screen"
          title="We couldn't load your assessment just now."
          onRetry={() => {
            void refetchStatus();
          }}
        />
      </div>
    );
  }

  // Pending, not loading: a retry paused while the tab is hidden has no data and no error yet
  if (isStatusPending) {
    return (
      <div className="bg-linear-to-br from-gray-50 via-ffp-light-purple/10 to-gray-50">
        <LoadingState layout="screen" />
      </div>
    );
  }

  // Redirect users with an active programme away — unless this is an explicit reassessment
  if (assessmentStatus.hasProgramme && !reassessParam) {
    return <Navigate to={routes[RouteKey.PROGRAMME_OVERVIEW].path} replace />;
  }

  if (!flowId) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-linear-to-br from-gray-50 via-ffp-light-purple/10 to-gray-50 p-6">
        <StaticAlert
          variant="error"
          message="No assessment flow specified. Please return to the home page."
        />
      </div>
    );
  }

  return (
    <AssessmentProvider flowId={flowId}>
      <div className="min-h-screen bg-linear-to-br from-gray-50 via-ffp-light-purple/10 to-gray-50">
        <AssessmentOrchestrator flowId={flowId} isReassessment={isReassessment} />
      </div>
    </AssessmentProvider>
  );
};
