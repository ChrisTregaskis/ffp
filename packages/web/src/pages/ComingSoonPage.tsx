import React from 'react';

import type { IconName } from '@web/components/atoms';
import { PageContainer } from '@web/components/atoms';
import { ComingSoon, PageHeader } from '@web/components/molecules';

export interface ComingSoonPageProps {
  /** Title for the page */
  title: string;
  /** Optional description of the feature */
  description?: string;
  /** Optional icon name */
  icon?: IconName;
}

/**
 * Reusable "Coming Soon" page component for placeholder routes.
 * Used for features that will be implemented in future sprints.
 */
export const ComingSoonPage: React.FC<ComingSoonPageProps> = ({
  title,
  description,
  icon = 'Clock',
}) => {
  return (
    <PageContainer>
      <PageHeader title={title} subtitle={description} />

      <ComingSoon icon={icon} message="This feature will be implemented in a future sprint." />
    </PageContainer>
  );
};
