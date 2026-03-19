import {
  createSystemContext,
  SYSTEM_PLACEHOLDER_TENANT_ID,
  type APIGatewayProxyEventV2WithJWT,
} from '@ffp/core/server';

import { validateAndMatchRoute, type RouteRegistry } from '../lib/router';

import { handler as createCustomerHandler } from './create-customer';
import { handler as getCustomerHandler } from './customers/get-customer';
import { handler as listCustomersHandler } from './customers/list-customers';
import { handler as updateCustomerHandler } from './customers/update-customer';
import { handler as createExerciseHandler } from './programme-templates/create-exercise';
import { handler as createPhaseHandler } from './programme-templates/create-phase';
import { handler as createSessionHandler } from './programme-templates/create-session';
import { handler as createProgrammeTemplateHandler } from './programme-templates/create-template';
import { handler as deactivateProgrammeTemplateHandler } from './programme-templates/deactivate-template';
import { handler as deleteExerciseHandler } from './programme-templates/delete-exercise';
import { handler as deletePhaseHandler } from './programme-templates/delete-phase';
import { handler as deleteSessionHandler } from './programme-templates/delete-session';
import { handler as getProgrammeTemplateHandler } from './programme-templates/get-template';
import { handler as listExercisesHandler } from './programme-templates/list-exercises';
import { handler as listProgrammeTemplatesHandler } from './programme-templates/list-templates';
import { handler as reorderExercisesHandler } from './programme-templates/reorder-exercises';
import { handler as reorderPhasesHandler } from './programme-templates/reorder-phases';
import { handler as reorderSessionsHandler } from './programme-templates/reorder-sessions';
import { handler as updateExerciseHandler } from './programme-templates/update-exercise';
import { handler as updatePhaseHandler } from './programme-templates/update-phase';
import { handler as updateSessionHandler } from './programme-templates/update-session';
import { handler as updateProgrammeTemplateHandler } from './programme-templates/update-template';
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
    '/programme-templates': createProgrammeTemplateHandler,
    '/programme-templates/{id}/phases': createPhaseHandler,
    '/phases/{id}/sessions': createSessionHandler,
    '/sessions/{id}/exercises': createExerciseHandler,
    '/videos': createVideoHandler,
    '/videos/upload-url': getUploadUrlHandler,
  },
  GET: {
    '/assessment-templates': listTemplatesHandler,
    '/assessment-templates/{id}': getTemplateHandler,
    '/customers': listCustomersHandler,
    '/customers/{id}': getCustomerHandler,
    '/programme-templates': listProgrammeTemplatesHandler,
    '/programme-templates/{id}': getProgrammeTemplateHandler,
    '/sessions/{id}/exercises': listExercisesHandler,
    '/videos': listVideosHandler,
  },
  PUT: {
    '/assessment-templates/{id}': updateTemplateHandler,
    '/customers/{id}': updateCustomerHandler,
    '/programme-templates/{id}': updateProgrammeTemplateHandler,
    '/programme-templates/{id}/deactivate': deactivateProgrammeTemplateHandler,
    '/programme-templates/{id}/phases/reorder': reorderPhasesHandler,
    '/phases/{id}': updatePhaseHandler,
    '/phases/{id}/sessions/reorder': reorderSessionsHandler,
    '/exercises/{id}': updateExerciseHandler,
    '/sessions/{id}': updateSessionHandler,
    '/sessions/{id}/exercises/reorder': reorderExercisesHandler,
    '/videos/{id}': updateVideoHandler,
  },
  DELETE: {
    '/assessment-templates/{id}': deactivateTemplateHandler,
    '/exercises/{id}': deleteExerciseHandler,
    '/phases/{id}': deletePhaseHandler,
    '/sessions/{id}': deleteSessionHandler,
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
