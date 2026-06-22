import {
  createSystemContext,
  SYSTEM_PLACEHOLDER_ORGANISATION_ID,
  type APIGatewayProxyEventV2WithJWT,
} from '@ffp/core/server';

import { validateAndMatchRoute, type RouteRegistry } from '../lib/router';

import { handler as createFlowHandler } from './assessment-flows/create-flow';
import { handler as createStepHandler } from './assessment-flows/create-step';
import { handler as deactivateFlowHandler } from './assessment-flows/deactivate-flow';
import { handler as deleteStepHandler } from './assessment-flows/delete-step';
import { handler as getFlowHandler } from './assessment-flows/get-flow';
import { handler as listFlowsHandler } from './assessment-flows/list-flows';
import { handler as reorderStepsHandler } from './assessment-flows/reorder-steps';
import { handler as updateFlowHandler } from './assessment-flows/update-flow';
import { handler as updateStepHandler } from './assessment-flows/update-step';
import { handler as createLocationHandler } from './locations/create-location';
import { handler as getLocationHandler } from './locations/get-location';
import { handler as listLocationsHandler } from './locations/list-locations';
import { handler as updateLocationHandler } from './locations/update-location';
import { handler as createOrganisationHandler } from './organisations/create-organisation';
import { handler as getOrganisationHandler } from './organisations/get-organisation';
import { handler as listOrganisationsHandler } from './organisations/list-organisations';
import { handler as updateOrganisationHandler } from './organisations/update-organisation';
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
import { handler as createUserHandler } from './users/create-user';
import { handler as getUserHandler } from './users/get-user';
import { handler as listUsersHandler } from './users/list-users';
import { handler as updateUserHandler } from './users/update-user';
import { handler as createVideoHandler } from './videos/create';
import { handler as getUploadUrlHandler } from './videos/get-upload-url';
import { handler as listVideosHandler } from './videos/list';
import { handler as updateVideoHandler } from './videos/update';

import type { APIGatewayProxyResultV2 } from 'aws-lambda';

/** Uses placeholder organisationId as routing happens before authentication. */
const ROUTER_CONTEXT = createSystemContext({
  systemId: 'admin-router',
  organisationId: SYSTEM_PLACEHOLDER_ORGANISATION_ID,
});

/** Route registry mapping HTTP methods to path handlers. */
const routes: RouteRegistry = {
  POST: {
    '/organisations': createOrganisationHandler,
    '/organisations/{orgId}/locations': createLocationHandler,
    '/assessment-flows': createFlowHandler,
    '/assessment-flows/{flowPublicId}/steps': createStepHandler,
    '/assessment-templates': createTemplateHandler,
    '/assessment-templates/{id}/duplicate': duplicateTemplateHandler,
    '/programme-templates': createProgrammeTemplateHandler,
    '/programme-templates/{id}/phases': createPhaseHandler,
    '/phases/{id}/sessions': createSessionHandler,
    '/sessions/{id}/exercises': createExerciseHandler,
    '/users': createUserHandler,
    '/videos': createVideoHandler,
    '/videos/upload-url': getUploadUrlHandler,
  },
  GET: {
    '/organisations': listOrganisationsHandler,
    '/organisations/{id}': getOrganisationHandler,
    '/locations': listLocationsHandler,
    '/locations/{id}': getLocationHandler,
    '/assessment-flows': listFlowsHandler,
    '/assessment-flows/{publicId}': getFlowHandler,
    '/assessment-templates': listTemplatesHandler,
    '/assessment-templates/{id}': getTemplateHandler,
    '/programme-templates': listProgrammeTemplatesHandler,
    '/programme-templates/{id}': getProgrammeTemplateHandler,
    '/sessions/{id}/exercises': listExercisesHandler,
    '/users': listUsersHandler,
    '/users/{id}': getUserHandler,
    '/videos': listVideosHandler,
  },
  PUT: {
    '/organisations/{id}': updateOrganisationHandler,
    '/locations/{id}': updateLocationHandler,
    '/assessment-flows/{publicId}': updateFlowHandler,
    // `/steps/reorder` MUST precede `/steps/{stepPublicId}`: both are dynamic and
    // the router matches in insertion order, so `{stepPublicId}` would otherwise
    // capture the literal `reorder` segment and route to the update handler.
    '/assessment-flows/{flowPublicId}/steps/reorder': reorderStepsHandler,
    '/assessment-flows/{flowPublicId}/steps/{stepPublicId}': updateStepHandler,
    '/assessment-templates/{id}': updateTemplateHandler,
    '/users/{id}': updateUserHandler,
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
    '/assessment-flows/{publicId}': deactivateFlowHandler,
    '/assessment-flows/{flowPublicId}/steps/{stepPublicId}': deleteStepHandler,
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
