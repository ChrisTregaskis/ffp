import { getDb } from '@ffp/database';

import { getUserIdFromContext, type TenantContext } from '../lib/context';
import { InternalServerError, NotFoundError, ValidationError } from '../lib/errors';
import {
  createAssessmentTemplateSchema,
  updateAssessmentTemplateSchema,
  type AssessmentTemplate,
  type CreateAssessmentTemplateInput,
  type UpdateAssessmentTemplateInput,
} from '../schemas/assessment-template.schema';

import * as templateRepository from './template.repository';

import type { AssessmentTemplateWithQuestions } from './template.repository';

export type { AssessmentTemplate, AssessmentTemplateWithQuestions };
export type CreateTemplateInput = Omit<CreateAssessmentTemplateInput, 'createdBy'>;

/** Create a new assessment template */
export async function createTemplateService(
  ctx: TenantContext,
  input: CreateTemplateInput
): Promise<AssessmentTemplate> {
  const userId = await getUserIdFromContext(ctx);

  // Build full input with createdBy from actor
  const fullInput: CreateAssessmentTemplateInput = {
    ...input,
    createdBy: userId,
  };

  // Validate against Zod schema
  const parseResult = createAssessmentTemplateSchema.safeParse(fullInput);

  if (!parseResult.success) {
    throw new ValidationError('Invalid template input', {
      errors: parseResult.error.errors,
    });
  }

  const db = getDb();

  return await templateRepository.createTemplate(db, parseResult.data);
}

/** Update an existing assessment template */
export async function updateTemplateService(
  _ctx: TenantContext,
  templateId: string,
  input: UpdateAssessmentTemplateInput
): Promise<AssessmentTemplate> {
  // Validate against Zod schema
  const parseResult = updateAssessmentTemplateSchema.safeParse(input);

  if (!parseResult.success) {
    throw new ValidationError('Invalid template update input', {
      errors: parseResult.error.errors,
    });
  }

  const db = getDb();

  return await templateRepository.updateTemplate(db, templateId, parseResult.data);
}

/** Deactivate an assessment template (soft delete) */
export async function deactivateTemplateService(
  _ctx: TenantContext,
  templateId: string
): Promise<void> {
  const db = getDb();

  await templateRepository.deactivateTemplate(db, templateId);
}

/** Duplicate an assessment template */
export async function duplicateTemplateService(
  ctx: TenantContext,
  templateId: string,
  newName: string
): Promise<AssessmentTemplateWithQuestions> {
  const userId = await getUserIdFromContext(ctx);
  const db = getDb();

  // Validate source template exists
  const sourceTemplate = await templateRepository.findTemplateById(db, templateId);

  if (!sourceTemplate) {
    throw new NotFoundError('Assessment template', templateId);
  }

  // Fetch source template's question assignments
  const sourceTemplateQuestions = await templateRepository.findQuestionAssignmentsByTemplateId(
    db,
    templateId
  );

  // Duplicate template and its questions in a transaction
  const duplicatedTemplateId = await templateRepository.createDuplicateTemplate(
    db,
    userId,
    newName,
    sourceTemplate,
    sourceTemplateQuestions
  );

  // Fetch and return the complete duplicated template with questions
  // (read operation, outside transaction - uses repository for full hydration)
  const result = await templateRepository.findTemplateWithQuestions(db, duplicatedTemplateId);

  // Should never be null since we just created it
  if (!result) {
    throw new InternalServerError('Failed to fetch duplicated template after creation');
  }

  return result;
}

/**
 * Get an assessment template by ID with questions
 * @param _ctx - Tenant context (unused for system content, but maintains consistent API)
 */
export async function getTemplateService(
  _ctx: TenantContext,
  templateId: string
): Promise<AssessmentTemplateWithQuestions | null> {
  const db = getDb();

  return await templateRepository.findTemplateWithQuestions(db, templateId);
}

/**
 * List assessment templates
 * @param _ctx - Tenant context (unused for system content, but maintains consistent API)
 */
export async function listTemplatesService(
  _ctx: TenantContext,
  options?: { activeOnly?: boolean }
): Promise<AssessmentTemplate[]> {
  const db = getDb();

  return await templateRepository.findAllTemplates(db, options);
}
