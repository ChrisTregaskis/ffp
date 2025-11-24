import React from 'react';

import { Card } from '@web/components/Card';
import { Icon } from '@web/components/Icon';
import type { IconName } from '@web/components/Icon/types';
import { Text, Title } from '@web/components/text';

export interface ComingSoonPageProps {
  // Title for the page
  title: string;
  // Optional description of the feature
  description?: string;
  // Optional icon name from Icomoon library
  icon?: IconName;
}

/**
 * Reusable "Coming Soon" page component for placeholder routes
 * Used for features that will be implemented in future sprints
 */
export const ComingSoonPage: React.FC<ComingSoonPageProps> = ({
  title,
  description,
  icon = 'Clock',
}) => {
  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <Title as="h1" colour="foreground" className="mb-2">
          {title}
        </Title>
        {description && (
          <Text styleProps={{ size: 'base', colour: 'muted-foreground' }}>{description}</Text>
        )}
      </div>

      <Card className="p-8">
        <div className="flex flex-col items-centre justify-center py-12">
          <div className="mb-4">
            <Icon
              name={icon}
              styleProps={{ size: 'xl', colour: 'var(--color-muted-foreground)' }}
            />
          </div>
          <Title as="h3" colour="muted-foreground" className="mb-2">
            Coming Soon
          </Title>
          <Text styleProps={{ size: 'base', colour: 'muted-foreground' }}>
            This feature will be implemented in a future sprint.
          </Text>
        </div>
      </Card>
    </div>
  );
};
