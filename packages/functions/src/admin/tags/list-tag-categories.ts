import { type AdminTagCategoryListResponse } from '@ffp/core';
import {
  type APIGatewayProxyEventV2WithJWT,
  withErrorHandling,
  withSystemAdmin,
  tagService,
} from '@ffp/core/server';

/**
 * GET /admin/tag-categories — the seeded categories in display order, each with every tag
 * (inactive ones included). Requires system_admin.
 */
export const handler = withErrorHandling(
  withSystemAdmin(
    'Only system administrators can view tags',
    async (
      _event: APIGatewayProxyEventV2WithJWT,
      context
    ): Promise<AdminTagCategoryListResponse> => {
      const categories = await tagService.listTagCategoriesService(context);

      return { categories };
    }
  )
);
