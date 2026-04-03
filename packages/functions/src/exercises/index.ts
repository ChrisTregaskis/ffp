import {
  createSystemContext,
  SYSTEM_PLACEHOLDER_ORGANISATION_ID,
  type APIGatewayProxyEventV2WithJWT,
} from '@ffp/core/server';

import { validateAndMatchRoute, type RouteRegistry } from '../lib/router';

import { handler as completeHandler } from './complete';

import type { APIGatewayProxyResultV2 } from 'aws-lambda';

const ROUTER_CONTEXT = createSystemContext({
  systemId: 'exercises-router',
  organisationId: SYSTEM_PLACEHOLDER_ORGANISATION_ID,
});

const routes: RouteRegistry = {
  PUT: {
    '/{completionId}/complete': completeHandler,
  },
};

export const handler = async (
  event: APIGatewayProxyEventV2WithJWT
): Promise<APIGatewayProxyResultV2> => {
  const result = validateAndMatchRoute(event, routes, 'exercises', ROUTER_CONTEXT);

  if (result.type === 'error') {
    return result.response;
  }

  return result.handler(event);
};
