import { z } from 'zod';

import type {
  CreatePhaseRequest,
  PhaseResponse,
  ReorderPhasesRequest,
  UpdatePhaseRequest,
} from '@ffp/core';
import { phaseResponseSchema } from '@ffp/core';

import { assertUuidPathParam, ffpClient, parseApiResponse } from '../../client';

const templateBasePath = '/admin/programme-templates';

const phaseResponseEnvelope = z.object({ phase: phaseResponseSchema });
const phasesResponseEnvelope = z.object({ phases: z.array(phaseResponseSchema) });

/** Phase CRUD + reorder for programme template hierarchy. */
export const adminPhasesApi = {
  /** Creates a new phase within a programme template. */
  create: async (templateId: string, data: CreatePhaseRequest): Promise<PhaseResponse> => {
    const checkedTemplateId = assertUuidPathParam(
      templateId,
      'POST /admin/programme-templates/{templateId}/phases'
    );
    const path = `${templateBasePath}/${checkedTemplateId}/phases`;
    const response = await ffpClient.post(path, data);

    return parseApiResponse(phaseResponseEnvelope, response, { method: 'POST', path }).phase;
  },

  /** Updates a phase (partial update). */
  update: async (phaseId: string, data: UpdatePhaseRequest): Promise<PhaseResponse> => {
    const checkedPhaseId = assertUuidPathParam(phaseId, 'PUT /admin/phases/{phaseId}');
    const path = `/admin/phases/${checkedPhaseId}`;
    const response = await ffpClient.put(path, data);

    return parseApiResponse(phaseResponseEnvelope, response, { method: 'PUT', path }).phase;
  },

  /** Deletes a phase and renumbers siblings. */
  delete: async (phaseId: string): Promise<void> => {
    const checkedPhaseId = assertUuidPathParam(phaseId, 'DELETE /admin/phases/{phaseId}');
    const path = `/admin/phases/${checkedPhaseId}`;
    await ffpClient.delete(path);
  },

  /** Reorders phases within a programme template. */
  reorder: async (templateId: string, data: ReorderPhasesRequest): Promise<PhaseResponse[]> => {
    const checkedTemplateId = assertUuidPathParam(
      templateId,
      'PUT /admin/programme-templates/{templateId}/phases/reorder'
    );
    const path = `${templateBasePath}/${checkedTemplateId}/phases/reorder`;
    const response = await ffpClient.put(path, data);

    return parseApiResponse(phasesResponseEnvelope, response, { method: 'PUT', path }).phases;
  },
};

export type { CreatePhaseRequest, PhaseResponse, ReorderPhasesRequest, UpdatePhaseRequest };
