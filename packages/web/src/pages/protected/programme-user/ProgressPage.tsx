import React from 'react';

import { PageContainer } from '@web/components/atoms';
import { ComingSoon, PageHeader } from '@web/components/molecules';

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

      <ComingSoon message="Progress tracking and analytics functionality will be implemented in a future sprint." />
    </PageContainer>
  );
};
