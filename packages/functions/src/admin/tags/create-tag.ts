import { type AdminTagResponse } from '@ffp/core';
import {
  type APIGatewayProxyEventV2WithJWT,
  withErrorHandling,
  withSystemAdmin,
  tagService,
} from '@ffp/core/server';

import { parseJsonBody } from '../../lib/request-body';

/** POST /admin/tags — create a tag in a category (slug unique within it). Requires system_admin. */
export const handler = withErrorHandling(
  withSystemAdmin(
    'Only system administrators can manage tags',
    async (event: APIGatewayProxyEventV2WithJWT, context): Promise<AdminTagResponse> => {
      const body = parseJsonBody(event.body);
      const tag = await tagService.createTagService(context, body);

      return { tag };
    }
  )
);
