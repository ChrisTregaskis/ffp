import React from 'react';

import { Card } from '@web/components/Card';
import { PageContainer, PageHeader } from '@web/components/layout';
import { Title, Text } from '@web/components/text';

/**
 * Account Settings page for all user types
 * Allows users to manage their account preferences and profile information
 */
export const AccountSettingsPage: React.FC = () => {
  return (
    <PageContainer>
      <PageHeader
        title="Account Settings"
        subtitle="Manage your account preferences and profile information"
      />

      <Card className="p-8">
        <div className="flex flex-col items-centre justify-center py-12">
          <Title as="h3" colour="muted-foreground" className="mb-2">
            Coming Soon
          </Title>
          <Text styleProps={{ size: 'base', colour: 'muted-foreground' }}>
            Account settings functionality will be implemented in a future sprint.
          </Text>
        </div>
      </Card>
    </PageContainer>
  );
};
