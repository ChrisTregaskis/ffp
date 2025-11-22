import React from 'react';

import { Card } from '@web/components/Card';
import { Title, Text } from '@web/components/text';

/**
 * Today's Workout page for individual users
 * Displays the current day's workout session and exercises
 */
export const TodayWorkoutPage: React.FC = () => {
  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <Title as="h1" colour="foreground" className="mb-2">
          Today&apos;s Workout
        </Title>
        <Text styleProps={{ size: 'base', colour: 'muted-foreground' }}>
          Your scheduled workout session for today
        </Text>
      </div>

      <Card className="p-8">
        <div className="flex flex-col items-centre justify-centre py-12">
          <Title as="h3" colour="muted-foreground" className="mb-2">
            Coming Soon
          </Title>
          <Text styleProps={{ size: 'base', colour: 'muted-foreground' }}>
            Today&apos;s workout functionality will be implemented in a future sprint.
          </Text>
        </div>
      </Card>
    </div>
  );
};
