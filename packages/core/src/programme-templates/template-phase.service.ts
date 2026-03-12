import { getDb } from '@ffp/database';
import type { TemplatePhaseRecord } from '@ffp/database/schema';

import { NotFoundError, ValidationError } from '../lib/errors';
import {
  createPhaseRequestSchema,
  updatePhaseRequestSchema,
  reorderPhasesRequestSchema,
  phaseResponseSchema,
} from '../schemas/programme.schema';

import * as templateRepository from './programme-template.repository';
import * as phaseRepository from './template-phase.repository';

import type { PhaseResponse } from '../schemas/programme.schema';

/** Maps a phase record to the API response shape. */
const toResponse = (record: TemplatePhaseRecord): PhaseResponse =>
  phaseResponseSchema.parse(record);

/** Returns all phases for a template, ordered by phaseNumber. */
export async function listPhases(templateId: string): Promise<PhaseResponse[]> {
  const db = getDb();

  const template = await templateRepository.findTemplateById(db, templateId);

  if (!template) {
    throw new NotFoundError('Programme template', templateId);
  }

  const phases = await phaseRepository.findPhasesByTemplateId(db, templateId);

  return phases.map(toResponse);
}

/**
 * Creates a new phase within a template.
 * Auto-assigns phaseNumber and updates template totalPhases.
 */
export async function createPhase(templateId: string, input: unknown): Promise<PhaseResponse> {
  const validated = createPhaseRequestSchema.parse(input);
  const db = getDb();

  const template = await templateRepository.findTemplateById(db, templateId);

  if (!template) {
    throw new NotFoundError('Programme template', templateId);
  }

  // Create phase and sync parent in a transaction
  const phase = await db.transaction(async (tx) => {
    const created = await phaseRepository.insertPhase(tx, templateId, validated);

    // Update template totalPhases
    await templateRepository.updateTemplate(tx, templateId, {
      totalPhases: template.totalPhases + 1,
    });

    return created;
  });

  return toResponse(phase);
}

/** Updates a phase. Returns the updated phase response. */
export async function updatePhase(phaseId: string, input: unknown): Promise<PhaseResponse> {
  const validated = updatePhaseRequestSchema.parse(input);
  const db = getDb();

  const updated = await phaseRepository.updatePhase(db, phaseId, validated);

  if (!updated) {
    throw new NotFoundError('Template phase', phaseId);
  }

  return toResponse(updated);
}

/**
 * Deletes a phase and updates template totalPhases.
 * Re-numbers remaining phases to maintain contiguous sequence.
 * DB cascade handles child sessions and exercises.
 */
export async function deletePhase(phaseId: string): Promise<void> {
  const db = getDb();

  const phase = await phaseRepository.findPhaseById(db, phaseId);

  if (!phase) {
    throw new NotFoundError('Template phase', phaseId);
  }

  const template = await templateRepository.findTemplateById(db, phase.programmeTemplateId);

  if (!template) {
    throw new NotFoundError('Programme template', phase.programmeTemplateId);
  }

  // Delete, renumber, and sync parent in a transaction
  await db.transaction(async (tx) => {
    await phaseRepository.deletePhase(tx, phaseId);
    await phaseRepository.renumberPhases(tx, phase.programmeTemplateId);
    await templateRepository.updateTemplate(tx, phase.programmeTemplateId, {
      totalPhases: Math.max(template.totalPhases - 1, 0),
    });
  });
}

/**
 * Reorders phases within a template.
 * Validates all provided IDs belong to the template before reordering.
 */
export async function reorderPhases(templateId: string, input: unknown): Promise<PhaseResponse[]> {
  const validated = reorderPhasesRequestSchema.parse(input);
  const db = getDb();

  const template = await templateRepository.findTemplateById(db, templateId);

  if (!template) {
    throw new NotFoundError('Programme template', templateId);
  }

  // Validate all IDs belong to this template
  const existingPhases = await phaseRepository.findPhasesByTemplateId(db, templateId);
  const existingIds = new Set(existingPhases.map((p) => p.id));

  const invalidIds = validated.orderedIds.filter((id) => !existingIds.has(id));

  if (invalidIds.length > 0) {
    throw new ValidationError(`Phase IDs do not belong to this template: ${invalidIds.join(', ')}`);
  }

  if (validated.orderedIds.length !== existingPhases.length) {
    throw new ValidationError(
      `Expected ${String(existingPhases.length)} phase IDs but received ${String(validated.orderedIds.length)}`
    );
  }

  // Reorder in a transaction
  const reordered = await db.transaction(async (tx) => {
    return await phaseRepository.reorderPhases(tx, templateId, validated.orderedIds);
  });

  return reordered.map(toResponse);
}
