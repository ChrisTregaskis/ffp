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
 * Reusable "Coming Soon" page for a route whose feature is not built yet.
 */
export const ComingSoonPage: React.FC<ComingSoonPageProps> = ({
  title,
  description,
  icon = 'Clock',
}) => {
  return (
    <PageContainer>
      <PageHeader title={title} subtitle={description} />

      <ComingSoon icon={icon} message="We're still building this. Check back soon." />
    </PageContainer>
  );
};
