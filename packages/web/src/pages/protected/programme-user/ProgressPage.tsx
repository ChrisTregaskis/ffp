import React from 'react';
import { useNavigate } from 'react-router-dom';

import { SectionHeader, SectionPanel } from '@web/components/assessment';
import { Button } from '@web/components/button';
import { Card } from '@web/components/Card';
import { Icons } from '@web/components/Icon';
import { PageContainer, PageHeader } from '@web/components/layout';
import { Text, Title } from '@web/components/text';
import { useUserAssessmentStatusQuery } from '@web/hooks/assessments';
import { routes, RouteKey } from '@web/pages/routes';

/**
 * Progress & Analytics page for individual users.
 *
 * Includes a "Start New Assessment" CTA so programme users can
 * trigger a reassessment at any time (replaces or keeps current programme).
 */
export const ProgressPage: React.FC = () => {
  const navigate = useNavigate();
  const { data: assessmentStatus } = useUserAssessmentStatusQuery();

  const handleStartReassessment = (): void => {
    if (!assessmentStatus?.assessmentFlowId) {
      return;
    }

    // One-time flag consumed by AssessmentOrchestrator to distinguish
    // an intentional CTA click from a page reload (which should resume).
    sessionStorage.setItem('ffp-reassessment-start', 'true');

    const path = `${routes[RouteKey.ASSESSMENT].path}?flowId=${assessmentStatus.assessmentFlowId}&reassess=true`;
    void navigate(path);
  };

  return (
    <PageContainer centred>
      <PageHeader
        title="Progress & Analytics"
        subtitle="Track your workout progress and view performance analytics"
      />

      {/* Reassessment CTA */}
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

      {/* Coming soon placeholder for analytics */}
      <Card className="p-8">
        <div className="flex flex-col items-center justify-center py-12">
          <Title as="h3" colour="muted-foreground" className="mb-2">
            Coming Soon
          </Title>
          <Text styleProps={{ size: 'base', colour: 'muted-foreground' }}>
            Progress tracking and analytics functionality will be implemented in a future sprint.
          </Text>
        </div>
      </Card>
    </PageContainer>
  );
};
