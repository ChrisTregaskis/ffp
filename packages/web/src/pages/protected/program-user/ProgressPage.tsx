import React from 'react';

import { Card } from '@web/components/Card';
import { Title, Text } from '@web/components/text';

/**
 * Progress & Analytics page for individual users
 * Displays the user's workout progress, statistics, and performance analytics
 */
export const ProgressPage: React.FC = () => {
  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <Title as="h1" colour="foreground" className="mb-2">
          Progress & Analytics
        </Title>
        <Text styleProps={{ size: 'base', colour: 'muted-foreground' }}>
          Track your workout progress and view performance analytics
        </Text>
      </div>

      <Card className="p-8">
        <div className="flex flex-col items-centre justify-centre py-12">
          <Title as="h3" colour="muted-foreground" className="mb-2">
            Coming Soon
          </Title>
          <Text styleProps={{ size: 'base', colour: 'muted-foreground' }}>
            Progress tracking and analytics functionality will be implemented in a future sprint.
          </Text>
        </div>
      </Card>
    </div>
  );
};
