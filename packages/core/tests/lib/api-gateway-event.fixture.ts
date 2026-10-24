import type { APIGatewayProxyEventV2WithJWT } from '../../src/lib/context';

/** A minimal API Gateway v2 event with no JWT authoriser, as an unauthenticated request arrives. */
export function createMockEvent(
  overrides?: Partial<APIGatewayProxyEventV2WithJWT>
): APIGatewayProxyEventV2WithJWT {
  const defaultEvent = {
    version: '2.0',
    routeKey: 'ANY /{proxy+}',
    rawPath: '/',
    rawQueryString: '',
    headers: {},
    requestContext: {
      accountId: '123456789012',
      apiId: 'test-api',
      domainName: 'test.execute-api.eu-west-2.amazonaws.com',
      domainPrefix: 'test',
      requestId: 'test-request-id',
      routeKey: 'ANY /{proxy+}',
      stage: '$default',
      time: new Date().toISOString(),
      timeEpoch: Date.now(),
      http: {
        method: 'GET',
        path: '/',
        protocol: 'HTTP/1.1',
        sourceIp: '127.0.0.1',
        userAgent: 'test-agent',
      },
    },
    isBase64Encoded: false,
  };

  // Cast to allow tests without JWT (will throw UnauthorizedError when context extraction fails)
  return { ...defaultEvent, ...overrides } as APIGatewayProxyEventV2WithJWT;
}
