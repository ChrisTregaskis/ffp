import {
  type APIGatewayProxyEventV2WithJWT,
  withErrorHandling,
  withSystemAdmin,
  ValidationError,
  templateSlotService,
} from '@ffp/core/server';

/**
 * Lambda handler for DELETE /admin/slots/{publicId}
 *
 * Deletes a template session slot and closes the gap in its session's order.
 */
export const handler = withErrorHandling(
  withSystemAdmin(
    'Only system administrators can delete session slots',
    async (event: APIGatewayProxyEventV2WithJWT): Promise<null> => {
      const publicId = event.pathParameters?.publicId;

      if (!publicId) {
        throw new ValidationError('Slot ID is required');
      }

      await templateSlotService.deleteSlot(publicId);

      return null;
    }
  )
);
