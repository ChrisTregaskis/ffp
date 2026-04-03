import {
  createSystemContext,
  SYSTEM_PLACEHOLDER_ORGANISATION_ID,
  type APIGatewayProxyEventV2WithJWT,
} from '@ffp/core/server';

import { validateAndMatchRoute, type RouteRegistry } from '../lib/router';

import { handler as getActiveHandler } from './get-active';
import { handler as getDetailHandler } from './get-detail';
import { handler as replaceActiveHandler } from './replace-active';

import type { APIGatewayProxyResultV2 } from 'aws-lambda';

const ROUTER_CONTEXT = createSystemContext({
  systemId: 'programmes-router',
  organisationId: SYSTEM_PLACEHOLDER_ORGANISATION_ID,
});

/**
 * Route registry mapping HTTP methods to path handlers.
 * Add new routes here to keep sst.config.ts clean.
 */
const routes: RouteRegistry = {
  GET: {
    '/active': getActiveHandler,
    '/active/detail': getDetailHandler,
  },
  PUT: {
    '/active/replace': replaceActiveHandler,
  },
};

/**
 * Main proxy handler that routes requests to domain handlers.
 * Returns 404 for unregistered routes, 405 for unsupported methods.
 */
export const handler = async (
  event: APIGatewayProxyEventV2WithJWT
): Promise<APIGatewayProxyResultV2> => {
  const result = validateAndMatchRoute(event, routes, 'programmes', ROUTER_CONTEXT);

  if (result.type === 'error') {
    return result.response;
  }

  // Execute the matched handler
  return result.handler(event);
};
