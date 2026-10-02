import { z } from 'zod';

import type {
  AdminFlowStepView,
  CreateFlowStepInput,
  ReorderFlowStepsInput,
  UpdateFlowStepInput,
} from '@ffp/core';
import { adminFlowStepSchema } from '@ffp/core';

import { ffpClient, parseApiResponse } from '../client';

const flowsBasePath = '/admin/assessment-flows';

const stepsPath = (flowPublicId: string): string => `${flowsBasePath}/${flowPublicId}/steps`;

const stepResponseSchema = z.object({ step: adminFlowStepSchema });
const stepsResponseSchema = z.object({ steps: z.array(adminFlowStepSchema) });

/** Every verb requires the system_admin role. */
export const adminFlowStepsApi = {
  /** The server assigns the new step's order. */
  create: async (flowPublicId: string, data: CreateFlowStepInput): Promise<AdminFlowStepView> => {
    const path = stepsPath(flowPublicId);
    const response = await ffpClient.post(path, data);

    return parseApiResponse(stepResponseSchema, response, { method: 'POST', path }).step;
  },

  /** Branching fields are not part of the update shape. */
  update: async (
    flowPublicId: string,
    stepPublicId: string,
    data: UpdateFlowStepInput
  ): Promise<AdminFlowStepView> => {
    const path = `${stepsPath(flowPublicId)}/${stepPublicId}`;
    const response = await ffpClient.put(path, data);

    return parseApiResponse(stepResponseSchema, response, { method: 'PUT', path }).step;
  },

  /** Soft delete — the row is kept. */
  delete: async (flowPublicId: string, stepPublicId: string): Promise<void> => {
    await ffpClient.delete(`${stepsPath(flowPublicId)}/${stepPublicId}`);
  },

  /** Answers 409 when the flow branches — the caller must explain, not retry. */
  reorder: async (
    flowPublicId: string,
    data: ReorderFlowStepsInput
  ): Promise<AdminFlowStepView[]> => {
    const path = `${stepsPath(flowPublicId)}/reorder`;
    const response = await ffpClient.put(path, data);

    return parseApiResponse(stepsResponseSchema, response, { method: 'PUT', path }).steps;
  },
};
