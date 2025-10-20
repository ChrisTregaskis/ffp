// Health check handler to verify workspace dependencies
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { APP_NAME, APP_VERSION, USER_ROLES } from "@ffp/core";

/**
 * Simple health check endpoint
 * Tests that @ffp/core imports work correctly in functions package
 */
export const handler = async (
  _event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  return {
    statusCode: 200,
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      status: "healthy",
      app: APP_NAME,
      version: APP_VERSION,
      roles: Object.values(USER_ROLES),
      timestamp: new Date().toISOString(),
    }),
  };
};
