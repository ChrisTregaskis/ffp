import type { APIGatewayProxyHandler, APIGatewayProxyResult } from 'aws-lambda';

export const handler: APIGatewayProxyHandler = (event): Promise<APIGatewayProxyResult> => {
  console.log('Health check event:', event);

  try {
    // Simple health check response
    const response = {
      status: 'healthy',
      message: 'FFP Functions - Health Check OK',
      timestamp: new Date().toISOString(),
      service: 'auth',
      version: '1.0.0',
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
        status: 'error',
        message: 'Health check failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
    });
  }
};
