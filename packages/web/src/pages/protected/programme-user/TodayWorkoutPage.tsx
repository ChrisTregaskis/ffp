import React from 'react';

import { Card } from '@web/components/Card';
import { PageContainer, PageHeader } from '@web/components/layout';
import { Title, Text } from '@web/components/text';

/**
 * Today's Workout page for individual users
 * Displays the current day's workout session and exercises
 */
export const TodayWorkoutPage: React.FC = () => {
  return (
    <PageContainer centred>
      <PageHeader title="Today's Workout" subtitle="Your scheduled workout session for today" />

      <Card className="p-8">
        <div className="flex flex-col items-center justify-center py-12">
          <Title as="h3" colour="muted-foreground" className="mb-2">
            Coming Soon
          </Title>
          <Text styleProps={{ size: 'base', colour: 'muted-foreground' }}>
            Today&apos;s workout functionality will be implemented in a future sprint.
          </Text>
        </div>
      </Card>
    </PageContainer>
  );
};
