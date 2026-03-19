import {
  type APIGatewayProxyEventV2WithJWT,
  extractUserContext,
  withErrorHandling,
  ForbiddenError,
  ValidationError,
  isUserActor,
  updateCustomerService,
} from '@ffp/core/server';

/**
 * Lambda handler for PUT /admin/customers/{id}
 *
 * Updates a customer's name, address, or status. Admin role required.
 */
export const handler = withErrorHandling(async (event: APIGatewayProxyEventV2WithJWT) => {
  const context = extractUserContext(event);

  if (!isUserActor(context.actor) || context.actor.userRole !== 'system_admin') {
    throw new ForbiddenError('Only system administrators can update customers');
  }

  const customerId = event.pathParameters?.id;

  if (!customerId) {
    throw new ValidationError('Customer ID is required');
  }

  const body = JSON.parse(event.body ?? '{}') as unknown;

  return await updateCustomerService(context, customerId, body);
});
