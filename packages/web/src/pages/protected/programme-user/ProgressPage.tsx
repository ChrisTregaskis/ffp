import React from 'react';

import { PageContainer } from '@web/components/atoms';
import { ComingSoon, PageHeader } from '@web/components/molecules';

/**
 * Progress & Analytics page for programme users.
 *
 * A placeholder until progress tracking is built.
 */
export const ProgressPage: React.FC = () => {
  return (
    <PageContainer centred>
      <PageHeader
        title="Progress & Analytics"
        subtitle="Track your workout progress and view performance analytics"
      />

      <ComingSoon message="Progress tracking is on its way." />
    </PageContainer>
  );
};
