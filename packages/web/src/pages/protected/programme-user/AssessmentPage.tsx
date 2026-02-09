import React from 'react';
import { useSearchParams } from 'react-router-dom';

import { AssessmentStepRenderer } from '@web/components/assessment/AssessmentStepRenderer/AssessmentStepRenderer';
import { StaticAlert } from '@web/components/feedback/StaticAlert';
import { AssessmentProvider } from '@web/contexts/assessments/AssessmentProvider';

/**
 * Fullscreen assessment page (no app layout or sidebar).
 *
 * Reads `flowId` from URL search params and wraps the assessment
 * flow in AssessmentProvider. Renders AssessmentStepRenderer which
 * orchestrates step-by-step rendering based on context state.
 */
export const AssessmentPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const flowId = searchParams.get('flowId');

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
        <AssessmentStepRenderer />
      </div>
    </AssessmentProvider>
  );
};
