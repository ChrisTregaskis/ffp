import {
  type APIGatewayProxyEventV2WithJWT,
  extractUserContext,
  withErrorHandling,
  ForbiddenError,
  isUserActor,
  getCustomerService,
} from '@ffp/core/server';

/**
 * Lambda handler for GET /admin/customers/{id}
 *
 * Returns a single customer by ID. Admin role required.
 */
export const handler = withErrorHandling(async (event: APIGatewayProxyEventV2WithJWT) => {
  const context = extractUserContext(event);

  if (!isUserActor(context.actor) || context.actor.userRole !== 'system_admin') {
    throw new ForbiddenError('Only system administrators can view customer details');
  }

  const customerId = event.pathParameters?.id;

  if (!customerId) {
    throw new ForbiddenError('Customer ID is required');
  }

  return await getCustomerService(customerId);
});
