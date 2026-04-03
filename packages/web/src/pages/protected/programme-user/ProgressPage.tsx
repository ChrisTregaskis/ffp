import React from 'react';

import { Card } from '@web/components/Card';
import { PageContainer, PageHeader } from '@web/components/layout';
import { Text, Title } from '@web/components/text';

/**
 * Progress & Analytics page for programme users.
 *
 * Displays programme and phase progress statistics.
 * Analytics functionality will be implemented in Sprint 12 (FFP-416).
 */
export const ProgressPage: React.FC = () => {
  return (
    <PageContainer centred>
      <PageHeader
        title="Progress & Analytics"
        subtitle="Track your workout progress and view performance analytics"
      />

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
