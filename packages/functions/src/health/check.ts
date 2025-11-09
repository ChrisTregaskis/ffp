import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';

/**
 * Public health check endpoint for monitoring and load balancer health checks.
 * No authentication required.
 *
 * @param _event - API Gateway V2 event (no JWT) - unused but required by Lambda signature
 * @returns Health status response
 */
export const handler = (_event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
  try {
    // Simple health check response
    const response = {
      status: 'healthy',
      message: 'FFP API - Health Check OK',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      stage: process.env.SST_STAGE ?? 'unknown',
    };

    return Promise.resolve({
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(response),
    });
  } catch (error) {
    console.error('Health check error:', error);
    return Promise.resolve({
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        status: 'unhealthy',
        message: 'Health check failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
    });
  }
};
