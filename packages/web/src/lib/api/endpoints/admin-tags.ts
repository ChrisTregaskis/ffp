import type { AdminTagCategory } from '@ffp/core';
import { adminTagCategoryListResponseSchema } from '@ffp/core';

import { ffpClient, parseApiResponse } from '../client';

/**
 * Admin Tag API methods
 * These endpoints require system_admin role.
 */
export const adminTagsApi = {
  /** The tag categories in display order, each with every tag (inactive ones included). */
  listCategories: async (signal?: AbortSignal): Promise<AdminTagCategory[]> => {
    const path = '/admin/tag-categories';
    const response = await ffpClient.get(path, { signal });

    return parseApiResponse(adminTagCategoryListResponseSchema, response, { method: 'GET', path })
      .categories;
  },
};
