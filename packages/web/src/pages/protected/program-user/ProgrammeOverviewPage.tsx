import React from 'react';

import { Card } from '@web/components/Card';
import { Title, Text } from '@web/components/text';

/**
 * Programme Overview page for individual users
 * Displays the user's workout programme schedule and calendar view
 */
export const ProgrammeOverviewPage: React.FC = () => {
  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <Title as="h1" colour="foreground" className="mb-2">
          Programme Overview
        </Title>
        <Text styleProps={{ size: 'base', colour: 'muted-foreground' }}>
          View your workout programme schedule and upcoming sessions
        </Text>
      </div>

      <Card className="p-8">
        <div className="flex flex-col items-centre justify-center py-12">
          <Title as="h3" colour="muted-foreground" className="mb-2">
            Coming Soon
          </Title>
          <Text styleProps={{ size: 'base', colour: 'muted-foreground' }}>
            Programme overview and calendar functionality will be implemented in a future sprint.
          </Text>
        </div>
      </Card>
    </div>
  );
};
