import { APP_NAME, testPathAliases } from '@ffp/core';

import { Title, Text } from '@web/components/text';

/**
 * PathAliasTest Component
 * Demonstrates both workspace imports (@ffp/core) and internal aliases (@web/) work correctly
 */
export const PathAliasTest: React.FC = () => {
  const testData = testPathAliases();

  return (
    <div className="space-y-6">
      <Title as="h2" colour="foreground">
        TypeScript Path Alias Test
      </Title>

      <div className="bg-success/10 border border-success/20 rounded-lg p-6">
        <Title as="h3" colour="success" className="mb-2">
          Workspace Import (@ffp/core)
        </Title>
        <Text styleProps={{ colour: 'success' }}>
          App Name: <strong className="font-semibold">{APP_NAME}</strong>
        </Text>
      </div>

      <div className="bg-info/10 border border-info/20 rounded-lg p-6">
        <Title as="h3" colour="info" className="mb-3">
          Internal Path Aliases
        </Title>
        <pre className="bg-foreground text-background p-4 rounded-md overflow-x-auto">
          <Text styleProps={{ size: 'sm' }}>
            {JSON.stringify(
              {
                tenant: {
                  id: testData.organisation.id,
                  name: testData.organisation.name,
                  type: testData.organisation.type,
                },
                user: {
                  id: testData.user.id,
                  email: testData.user.email,
                  role: testData.user.role,
                },
              },
              null,
              2
            )}
          </Text>
        </pre>
      </div>

      <div className="bg-gradient-to-r from-success to-info text-white rounded-lg p-6 shadow-lg">
        <div className="flex items-center space-x-3">
          <span className="text-3xl">✅</span>
          <div>
            <Text as="p" styleProps={{ size: 'lg', weight: 'semibold' }}>
              All path aliases working correctly!
            </Text>
            <Text as="p" styleProps={{ size: 'sm' }} className="mt-1 opacity-90">
              TailwindCSS is also configured and rendering styles
            </Text>
          </div>
        </div>
      </div>
    </div>
  );
};
