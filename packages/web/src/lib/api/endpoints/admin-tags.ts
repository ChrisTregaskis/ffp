import type { AdminTag, AdminTagCategory, CreateTagInput, UpdateTagInput } from '@ffp/core';
import { adminTagCategoryListResponseSchema, adminTagResponseSchema } from '@ffp/core';

import { ffpClient, parseApiResponse } from '../client';

const tagsPath = '/admin/tags';

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

  /** Adds a tag to a category; a slug already used in that category answers 409. */
  createTag: async (data: CreateTagInput): Promise<AdminTag> => {
    const response = await ffpClient.post(tagsPath, data);

    return parseApiResponse(adminTagResponseSchema, response, { method: 'POST', path: tagsPath })
      .tag;
  },

  /** Renames a tag or brings it back into use; the slug never changes. */
  updateTag: async (publicId: string, data: UpdateTagInput): Promise<AdminTag> => {
    const path = `${tagsPath}/${publicId}`;
    const response = await ffpClient.put(path, data);

    return parseApiResponse(adminTagResponseSchema, response, { method: 'PUT', path }).tag;
  },

  /** Takes a tag out of use; videos already carrying it keep it. */
  deactivateTag: async (publicId: string): Promise<void> => {
    await ffpClient.delete(`${tagsPath}/${publicId}`);
  },
};
