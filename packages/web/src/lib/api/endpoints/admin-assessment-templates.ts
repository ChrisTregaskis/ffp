import { z } from 'zod';

import type { AssessmentTemplate } from '@ffp/core';
import { assessmentTemplateSchema } from '@ffp/core';

import { ffpClient, parseApiResponse } from '../client';

const basePath = '/admin/assessment-templates';

const templateListResponseSchema = z.object({
  templates: z.array(assessmentTemplateSchema),
  count: z.number().int().nonnegative(),
});

/** Read-only, and requires the system_admin role like every other `/admin` endpoint. */
export const adminAssessmentTemplatesApi = {
  list: async (activeOnly = false, signal?: AbortSignal): Promise<AssessmentTemplate[]> => {
    const params = activeOnly ? { activeOnly: 'true' } : undefined;
    const response = await ffpClient.get(basePath, { params, signal });

    return parseApiResponse(templateListResponseSchema, response, {
      method: 'GET',
      path: basePath,
    }).templates;
  },
};
