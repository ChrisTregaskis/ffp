import { userProfileResponseSchema, type UserProfileResponse } from '@ffp/core';
import {
  type APIGatewayProxyEventV2WithJWT,
  extractUserContext,
  isUserActor,
  withErrorHandling,
  userRepository,
  UnauthorisedError,
  NotFoundError,
} from '@ffp/core/server';

/**
 * Lambda handler for GET /users/me
 *
 * Returns the authenticated user's profile (firstName, lastName, email, role).
 * Resolves Cognito sub → database user via RLS-scoped query.
 */
export const handler = withErrorHandling(
  async (event: APIGatewayProxyEventV2WithJWT): Promise<UserProfileResponse> => {
    const context = extractUserContext(event);

    if (!isUserActor(context.actor)) {
      throw new UnauthorisedError('This endpoint requires a user context');
    }

    const user = await userRepository.findUserByCognitoSub(
      context.organisationId,
      context.actor.userId
    );

    if (!user) {
      throw new NotFoundError('User profile not found');
    }

    return userProfileResponseSchema.parse({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
    });
  }
);
