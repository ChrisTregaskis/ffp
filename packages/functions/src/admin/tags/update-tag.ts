import { type AdminTagResponse } from '@ffp/core';
import {
  type APIGatewayProxyEventV2WithJWT,
  withErrorHandling,
  withSystemAdmin,
  tagService,
  ValidationError,
} from '@ffp/core/server';

import { parseJsonBody } from '../../lib/request-body';

/** PUT /admin/tags/:publicId — change a tag's label or active flag. Requires system_admin. */
export const handler = withErrorHandling(
  withSystemAdmin(
    'Only system administrators can manage tags',
    async (event: APIGatewayProxyEventV2WithJWT, context): Promise<AdminTagResponse> => {
      const publicId = event.pathParameters?.publicId;

      if (!publicId) {
        throw new ValidationError('Tag ID is required in path');
      }

      const body = parseJsonBody(event.body);
      const tag = await tagService.updateTagService(context, publicId, body);

      return { tag };
    }
  )
);
