/**
 * Health check handler
 * Tests workspace imports (@ffp/core) and internal aliases
 */
import type { APIGatewayProxyHandler } from "aws-lambda";
import { APP_NAME, testPathAliases } from "@ffp/core";

export const handler: APIGatewayProxyHandler = async (event) => {
  console.log("Health check event:", event);

  // Test internal path aliases by importing from @ffp/core
  const pathTest = testPathAliases();

  return {
    statusCode: 200,
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      status: "healthy",
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
