import { z } from 'zod';

import type {
  CreatePhaseRequest,
  PhaseResponse,
  ReorderPhasesRequest,
  UpdatePhaseRequest,
} from '@ffp/core';
import { phaseResponseSchema } from '@ffp/core';

import { ffpClient, parseApiResponse } from '../../client';

const templateBasePath = '/admin/programme-templates';

const phaseResponseEnvelope = z.object({ phase: phaseResponseSchema });
const phasesResponseEnvelope = z.object({ phases: z.array(phaseResponseSchema) });

/** Phase CRUD + reorder for programme template hierarchy. */
export const adminPhasesApi = {
  /** Creates a new phase within a programme template. */
  create: async (templateId: string, data: CreatePhaseRequest): Promise<PhaseResponse> => {
    const path = `${templateBasePath}/${templateId}/phases`;
    const response = await ffpClient.post(path, data);

    return parseApiResponse(phaseResponseEnvelope, response, { method: 'POST', path }).phase;
  },

  /** Updates a phase (partial update). */
  update: async (phaseId: string, data: UpdatePhaseRequest): Promise<PhaseResponse> => {
    const path = `/admin/phases/${phaseId}`;
    const response = await ffpClient.put(path, data);

    return parseApiResponse(phaseResponseEnvelope, response, { method: 'PUT', path }).phase;
  },

  /** Deletes a phase and renumbers siblings. */
  delete: async (phaseId: string): Promise<void> => {
    const path = `/admin/phases/${phaseId}`;
    await ffpClient.delete(path);
  },

  /** Reorders phases within a programme template. */
  reorder: async (templateId: string, data: ReorderPhasesRequest): Promise<PhaseResponse[]> => {
    const path = `${templateBasePath}/${templateId}/phases/reorder`;
    const response = await ffpClient.put(path, data);

    return parseApiResponse(phasesResponseEnvelope, response, { method: 'PUT', path }).phases;
  },
};

export type { CreatePhaseRequest, PhaseResponse, ReorderPhasesRequest, UpdatePhaseRequest };
