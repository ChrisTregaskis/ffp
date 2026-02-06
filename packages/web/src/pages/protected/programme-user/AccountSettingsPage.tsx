import React from 'react';

import { Card } from '@web/components/Card';
import { Title, Text } from '@web/components/text';

/**
 * Account Settings page for all user types
 * Allows users to manage their account preferences and profile information
 */
export const AccountSettingsPage: React.FC = () => {
  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <Title as="h1" colour="foreground" className="mb-2">
          Account Settings
        </Title>
        <Text styleProps={{ size: 'base', colour: 'muted-foreground' }}>
          Manage your account preferences and profile information
        </Text>
      </div>

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
    </div>
  );
};
