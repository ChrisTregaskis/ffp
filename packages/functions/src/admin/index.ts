import { createSystemContext, type APIGatewayProxyEventV2WithJWT } from '@ffp/core/server';

import { validateAndMatchRoute, type RouteRegistry } from '../lib/router';

import { handler as createCustomerHandler } from './create-customer';
import { handler as createTemplateHandler } from './templates/create-template';
import { handler as deactivateTemplateHandler } from './templates/deactivate-template';
import { handler as duplicateTemplateHandler } from './templates/duplicate-template';
import { handler as getTemplateHandler } from './templates/get-template';
import { handler as listTemplatesHandler } from './templates/list-templates';
import { handler as updateTemplateHandler } from './templates/update-template';

import type { APIGatewayProxyResultV2 } from 'aws-lambda';

/**
 * Infrastructure-level system context for router logging.
 * Uses placeholder tenantId as routing happens before authentication.
 */
const ROUTER_CONTEXT = createSystemContext({
  systemId: 'admin-router',
  tenantId: '00000000-0000-0000-8000-000000000000', // Placeholder for pre-auth routing
});

/**
 * Route registry mapping HTTP methods to path handlers.
 * Add new routes here to keep sst.config.ts clean.
 */
const routes: RouteRegistry = {
  POST: {
    '/create-customer': createCustomerHandler,
    '/assessment-templates': createTemplateHandler,
    '/assessment-templates/{id}/duplicate': duplicateTemplateHandler,
  },
  GET: {
    '/assessment-templates': listTemplatesHandler,
    '/assessment-templates/{id}': getTemplateHandler,
  },
  PUT: {
    '/assessment-templates/{id}': updateTemplateHandler,
  },
  DELETE: {
    '/assessment-templates/{id}': deactivateTemplateHandler,
  },
};

/**
 * Main proxy handler that routes requests to domain handlers.
 * Returns 404 for unregistered routes, 405 for unsupported methods.
 */
export const handler = async (
  event: APIGatewayProxyEventV2WithJWT
): Promise<APIGatewayProxyResultV2> => {
  const result = validateAndMatchRoute(event, routes, 'admin', ROUTER_CONTEXT);

  if (result.type === 'error') {
    return result.response;
  }

  // Execute the matched handler
  return result.handler(event);
};
