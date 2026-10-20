import React from 'react';

import { Icon, Text, Title } from '@web/components/atoms';
import type { IconName } from '@web/components/atoms';

import { Card } from '../Card';

export interface ComingSoonProps {
  /** What is on its way */
  message: string;
  /** Shown above the heading */
  icon?: IconName;
}

/** Placeholder card for a feature that is not built yet. */
export const ComingSoon: React.FC<ComingSoonProps> = ({ message, icon }) => (
  <Card>
    <div className="flex flex-col items-center justify-center py-12">
      {icon && (
        <div className="mb-4">
          <Icon name={icon} styleProps={{ size: 'xl', colour: 'var(--color-muted-foreground)' }} />
        </div>
      )}
      <Title as="h3" colour="muted-foreground" className="mb-2">
        Coming Soon
      </Title>
      <Text styleProps={{ size: 'base', colour: 'muted-foreground' }}>{message}</Text>
    </div>
  </Card>
);
