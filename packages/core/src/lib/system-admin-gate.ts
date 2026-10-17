import {
  extractUserContext,
  isUserActor,
  type APIGatewayProxyEventV2WithJWT,
  type OrganisationContext,
} from './context.js';
import { ForbiddenError } from './errors.js';
import { createLogger } from './logger.js';

/**
 * Gates an admin handler on the `system_admin` role. Compose inside `withErrorHandling`:
 *
 * ```typescript
 * export const handler = withErrorHandling(
 *   withSystemAdmin('Only system administrators can list users', async (event, context) => …)
 * );
 * ```
 *
 * The check runs before the handler reads anything from the event, so a refused caller
 * cannot tell a 400 from a 404. A missing or invalid JWT still surfaces as 401 from
 * `extractUserContext`.
 *
 * Every refusal logs one warn line, which admin-403 monitoring counts. Keep its shape stable:
 * `message: 'Admin access denied'`, with `requestId` and `organisationId` at the top level and
 * `context: { action: 'admin_access_denied', userId, actorType, role, method, path }`.
 *
 * @param forbiddenMessage - The endpoint's own 403 message, returned to the caller
 */
export const withSystemAdmin = <TResult>(
  forbiddenMessage: string,
  handler: (event: APIGatewayProxyEventV2WithJWT, context: OrganisationContext) => Promise<TResult>
) => {
  return async (event: APIGatewayProxyEventV2WithJWT): Promise<TResult> => {
    const context = extractUserContext(event);
    const { actor } = context;

    if (!isUserActor(actor) || actor.userRole !== 'system_admin') {
      createLogger(context).warn('Admin access denied', {
        action: 'admin_access_denied',
        userId: isUserActor(actor) ? actor.userId : null,
        actorType: actor.type,
        role: isUserActor(actor) ? actor.userRole : null,
        method: event.requestContext.http.method,
        path: event.rawPath,
      });

      throw new ForbiddenError(forbiddenMessage);
    }

    return handler(event, context);
  };
};
