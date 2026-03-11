import {
  createSystemContext,
  SYSTEM_PLACEHOLDER_TENANT_ID,
  type APIGatewayProxyEventV2WithJWT,
} from '@ffp/core/server';

import { validateAndMatchRoute, type RouteRegistry } from '../lib/router';

import { handler as createCustomerHandler } from './create-customer';
import { handler as createTemplateHandler } from './templates/create-template';
import { handler as deactivateTemplateHandler } from './templates/deactivate-template';
import { handler as duplicateTemplateHandler } from './templates/duplicate-template';
import { handler as getTemplateHandler } from './templates/get-template';
import { handler as listTemplatesHandler } from './templates/list-templates';
import { handler as updateTemplateHandler } from './templates/update-template';
import { handler as createVideoHandler } from './videos/create';
import { handler as getUploadUrlHandler } from './videos/get-upload-url';
import { handler as listVideosHandler } from './videos/list';
import { handler as updateVideoHandler } from './videos/update';

import type { APIGatewayProxyResultV2 } from 'aws-lambda';

/** Uses placeholder tenantId as routing happens before authentication. */
const ROUTER_CONTEXT = createSystemContext({
  systemId: 'admin-router',
  tenantId: SYSTEM_PLACEHOLDER_TENANT_ID,
});

/** Route registry mapping HTTP methods to path handlers. */
const routes: RouteRegistry = {
  POST: {
    '/create-customer': createCustomerHandler,
    '/assessment-templates': createTemplateHandler,
    '/assessment-templates/{id}/duplicate': duplicateTemplateHandler,
    '/videos': createVideoHandler,
    '/videos/upload-url': getUploadUrlHandler,
  },
  GET: {
    '/assessment-templates': listTemplatesHandler,
    '/assessment-templates/{id}': getTemplateHandler,
    '/videos': listVideosHandler,
  },
  PUT: {
    '/assessment-templates/{id}': updateTemplateHandler,
    '/videos/{id}': updateVideoHandler,
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
