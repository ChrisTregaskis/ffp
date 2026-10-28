import {
  type APIGatewayProxyEventV2WithJWT,
  withErrorHandling,
  withSystemAdmin,
  ValidationError,
  updateOrganisationService,
} from '@ffp/core/server';

import { parseJsonBody } from '../../lib/request-body';

/**
 * Lambda handler for PUT /admin/organisations/{id}
 *
 * Updates an organisation's name, status, or settings. Admin role required.
 */
export const handler = withErrorHandling(
  withSystemAdmin(
    'Only system administrators can update organisations',
    async (event: APIGatewayProxyEventV2WithJWT, context) => {
      const organisationId = event.pathParameters?.id;

      if (!organisationId) {
        throw new ValidationError('Organisation ID is required');
      }

      const body = parseJsonBody(event.body);

      return await updateOrganisationService(context, organisationId, body);
    }
  )
);
