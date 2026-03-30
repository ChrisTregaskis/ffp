import React from 'react';
import { useNavigate } from 'react-router-dom';

import { SectionHeader, SectionPanel } from '@web/components/assessment';
import { Button } from '@web/components/button';
import { Icons } from '@web/components/Icon';
import { PageContainer, PageHeader } from '@web/components/layout';
import { Text } from '@web/components/text';
import { useUserAssessmentStatusQuery } from '@web/hooks/assessments';
import { routes, RouteKey } from '@web/pages/routes';

import { REASSESSMENT_START_KEY } from './assessment.constants';

export const AssessmentOverviewPage: React.FC = () => {
  const navigate = useNavigate();
  const { data: assessmentStatus } = useUserAssessmentStatusQuery();

  const handleStartReassessment = (): void => {
    if (!assessmentStatus?.assessmentFlowId) {
      return;
    }

    // One-time flag consumed by AssessmentOrchestrator to distinguish
    // an intentional CTA click from a page reload (which should resume).
    sessionStorage.setItem(REASSESSMENT_START_KEY, 'true');

    const path = `${routes[RouteKey.ASSESSMENT].path}?flowId=${assessmentStatus.assessmentFlowId}&reassess=true`;
    void navigate(path);
  };

  return (
    <PageContainer centred>
      <PageHeader
        title="Assessment"
        subtitle="Review your assessment and update your programme recommendation"
      />

      <SectionPanel className="mb-6 p-6">
        <SectionHeader
          icon={Icons.REPEAT}
          title="Reassess Your Programme"
          description="Start a new assessment to update your programme recommendation based on your current condition."
          as="h2"
        />
        <div className="mt-4">
          <Button
            variant="primary"
            onClick={handleStartReassessment}
            disabled={!assessmentStatus?.assessmentFlowId}
          >
            Start New Assessment
          </Button>
        </div>
      </SectionPanel>

      <Text styleProps={{ size: 'sm', colour: 'muted-foreground' }}>
        Assessment scores and trends will be available in a future update.
      </Text>
    </PageContainer>
  );
};
