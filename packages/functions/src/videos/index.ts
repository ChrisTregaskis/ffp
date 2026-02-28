import {
  createSystemContext,
  SYSTEM_PLACEHOLDER_TENANT_ID,
  type APIGatewayProxyEventV2WithJWT,
} from '@ffp/core/server';

import { validateAndMatchRoute, type RouteRegistry } from '../lib/router';

import { handler as getSignedUrlHandler } from './get-signed-url';

import type { APIGatewayProxyResultV2 } from 'aws-lambda';

const ROUTER_CONTEXT = createSystemContext({
  systemId: 'videos-router',
  tenantId: SYSTEM_PLACEHOLDER_TENANT_ID,
});

/**
 * Route registry for the videos domain.
 */
const routes: RouteRegistry = {
  GET: {
    '/{id}/signed-url': getSignedUrlHandler,
  },
};

/**
 * Main proxy handler for the videos domain.
 * Routes requests to individual handlers, returns 404/405 for unmatched routes.
 */
export const handler = async (
  event: APIGatewayProxyEventV2WithJWT
): Promise<APIGatewayProxyResultV2> => {
  const result = validateAndMatchRoute(event, routes, 'videos', ROUTER_CONTEXT);

  if (result.type === 'error') {
    return result.response;
  }

  return result.handler(event);
};
