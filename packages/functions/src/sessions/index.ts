import {
  createSystemContext,
  SYSTEM_PLACEHOLDER_ORGANISATION_ID,
  type APIGatewayProxyEventV2WithJWT,
} from '@ffp/core/server';

import { validateAndMatchRoute, type RouteRegistry } from '../lib/router';

import { handler as completeHandler } from './complete';
import { handler as skipHandler } from './skip';
import { handler as startHandler } from './start';

import type { APIGatewayProxyResultV2 } from 'aws-lambda';

const ROUTER_CONTEXT = createSystemContext({
  systemId: 'sessions-router',
  organisationId: SYSTEM_PLACEHOLDER_ORGANISATION_ID,
});

const routes: RouteRegistry = {
  POST: {
    '/start': startHandler,
  },
  PUT: {
    '/{id}/complete': completeHandler,
    '/{id}/skip': skipHandler,
  },
};

export const handler = async (
  event: APIGatewayProxyEventV2WithJWT
): Promise<APIGatewayProxyResultV2> => {
  const result = validateAndMatchRoute(event, routes, 'sessions', ROUTER_CONTEXT);

  if (result.type === 'error') {
    return result.response;
  }

  return result.handler(event);
};
