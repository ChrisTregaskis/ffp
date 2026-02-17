import React from 'react';
import { Navigate, useSearchParams } from 'react-router-dom';

import { StaticAlert } from '@web/components/feedback/StaticAlert';
import { LoadingSpinner } from '@web/components/LoadingSpinner';
import { AssessmentProvider } from '@web/contexts/assessments/AssessmentProvider';
import { useUserAssessmentStatusQuery } from '@web/hooks/assessments';
import { routes, RouteKey } from '@web/pages/routes';

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
  const { data: assessmentStatus, isLoading: isStatusLoading } = useUserAssessmentStatusQuery();

  // Only treat as reassessment if param is set AND user actually has a programme
  const isReassessment = reassessParam && !!assessmentStatus?.hasProgramme;

  // Show loading while checking programme status
  if (isStatusLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-linear-to-br from-gray-50 via-ffp-light-purple/10 to-gray-50">
        <LoadingSpinner size="lg" variant="center" />
      </div>
    );
  }

  // Redirect users with an active programme away — unless this is an explicit reassessment
  if (assessmentStatus?.hasProgramme && !reassessParam) {
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
