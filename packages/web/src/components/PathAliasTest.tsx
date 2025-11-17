import { APP_NAME, testPathAliases } from '@ffp/core';

/**
 * PathAliasTest Component
 * Demonstrates both workspace imports (@ffp/core) and internal aliases (@web/) work correctly
 */
export const PathAliasTest: React.FC = () => {
  const testData = testPathAliases();

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold text-gray-900">TypeScript Path Alias Test</h2>

      <div className="bg-green-50 border border-green-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-green-900 mb-2">Workspace Import (@ffp/core)</h3>
        <p className="text-green-700">
          App Name: <strong className="font-semibold">{APP_NAME}</strong>
        </p>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-blue-900 mb-3">Internal Path Aliases</h3>
        <pre className="bg-gray-900 text-gray-100 p-4 rounded-md overflow-x-auto text-sm">
          {JSON.stringify(
            {
              tenant: {
                id: testData.tenant.id,
                name: testData.tenant.name,
                type: testData.tenant.type,
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
        </pre>
      </div>

      <div className="bg-gradient-to-r from-green-400 to-blue-500 text-white rounded-lg p-6 shadow-lg">
        <div className="flex items-center space-x-3">
          <span className="text-3xl">✅</span>
          <div>
            <p className="text-lg font-semibold">All path aliases working correctly!</p>
            <p className="text-sm text-green-50 mt-1">
              TailwindCSS is also configured and rendering styles
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
