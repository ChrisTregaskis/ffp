import {
  type APIGatewayProxyEventV2WithJWT,
  withErrorHandling,
  withSystemAdmin,
  tagService,
  ValidationError,
} from '@ffp/core/server';

interface DeactivateTagResponse {
  success: boolean;
}

/**
 * DELETE /admin/tags/:publicId — soft-delete a tag (isActive=false). Requires system_admin.
 * No hard-delete: videos keep the tags they carry.
 */
export const handler = withErrorHandling(
  withSystemAdmin(
    'Only system administrators can manage tags',
    async (event: APIGatewayProxyEventV2WithJWT, context): Promise<DeactivateTagResponse> => {
      const publicId = event.pathParameters?.publicId;

      if (!publicId) {
        throw new ValidationError('Tag ID is required in path');
      }

      await tagService.deactivateTagService(context, publicId);

      return { success: true };
    }
  )
);
