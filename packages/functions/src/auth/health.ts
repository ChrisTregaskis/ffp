import { APP_NAME, testPathAliases } from '@ffp/core';

import type { APIGatewayProxyHandler } from 'aws-lambda';

interface HealthCheckResponse {
  statusCode: number;
  headers: Record<string, string>;
  body: string;
}

/**
 * Health check handler
 * Tests workspace imports (@ffp/core) and internal aliases
 */
export const handler: APIGatewayProxyHandler = async (event): Promise<HealthCheckResponse> => {
  console.log('Health check event:', event);

  // Simulate async operation
  await new Promise((resolve) => {
    resolve(true);
  });

  // Test internal path aliases by importing from @ffp/core
  const pathTest = testPathAliases();

  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      status: 'healthy',
      message: `${APP_NAME} Functions - Health Check OK`,
      timestamp: new Date().toISOString(),
      pathAliasTest: {
        appName: pathTest.appName,
        tenantId: pathTest.tenant.id,
        userId: pathTest.user.id,
      },
    }),
  };
};
