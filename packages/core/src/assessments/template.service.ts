import { getDb } from '@ffp/database';

import { isUserActor, type TenantContext } from '../lib/context';
import {
  InternalServerError,
  NotFoundError,
  UnauthorisedError,
  ValidationError,
} from '../lib/errors';
import {
  createAssessmentTemplateSchema,
  updateAssessmentTemplateSchema,
  type AssessmentTemplate,
  type CreateAssessmentTemplateInput,
  type UpdateAssessmentTemplateInput,
} from '../schemas/assessment-template.schema';

import * as templateRepository from './template.repository';

import type { AssessmentTemplateWithQuestions } from './template.repository';

// Re-export types for convenience
export type { AssessmentTemplate, AssessmentTemplateWithQuestions };

export type CreateTemplateInput = Omit<CreateAssessmentTemplateInput, 'createdBy'>;

/**
 * Get actor's user ID from context
 *
 * For template operations, we use the Cognito sub directly as the createdBy
 * value since templates are system content and don't require RLS user resolution.
 *
 * @throws UnauthorisedError if actor is not a user
 */
function getActorUserId(ctx: TenantContext): string {
  if (!isUserActor(ctx.actor)) {
    throw new UnauthorisedError('This operation requires a user context');
  }

  return ctx.actor.userId;
}

/**
 * Create a new assessment template
 *
 * Validates input against Zod schema and sets createdBy from actor context.
 */
export async function createTemplateService(
  ctx: TenantContext,
  input: CreateTemplateInput
): Promise<AssessmentTemplate> {
  const userId = getActorUserId(ctx);

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

  return await templateRepository.create(db, parseResult.data);
}

/**
 * Update an existing assessment template
 *
 * Validates input against Zod schema and delegates to repository.
 * Version is auto-incremented by the repository.
 */
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

  return await templateRepository.update(db, templateId, parseResult.data);
}

/**
 * Deactivate an assessment template (soft delete)
 *
 * Sets isActive to false rather than deleting the record.
 * This preserves referential integrity with existing assessments.
 */
export async function deactivateTemplateService(
  _ctx: TenantContext,
  templateId: string
): Promise<void> {
  const db = getDb();

  await templateRepository.deactivate(db, templateId);
}

/**
 * Duplicate an assessment template
 *
 * Creates a copy of an existing template including all its question assignments.
 * The write operations are wrapped in a transaction to ensure atomicity - if the
 * question copy fails, the entire operation is rolled back.
 */
export async function duplicateTemplateService(
  ctx: TenantContext,
  templateId: string,
  newName: string
): Promise<AssessmentTemplateWithQuestions> {
  const userId = getActorUserId(ctx);
  const db = getDb();

  // Validate source template exists
  const sourceTemplate = await templateRepository.findById(db, templateId);

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
  const result = await templateRepository.findWithQuestions(db, duplicatedTemplateId);

  // Should never be null since we just created it
  if (!result) {
    throw new InternalServerError('Failed to fetch duplicated template after creation');
  }

  return result;
}

/**
 * Get an assessment template by ID with questions
 *
 * Fetches template and its associated questions via template_questions join.
 *
 * @param _ctx - Tenant context (unused for system content, but maintains consistent API)
 * @param templateId - ID of the template to fetch
 * @returns Template with questions or null if not found
 */
export async function getTemplateService(
  _ctx: TenantContext,
  templateId: string
): Promise<AssessmentTemplateWithQuestions | null> {
  const db = getDb();

  return await templateRepository.findWithQuestions(db, templateId);
}

/**
 * List assessment templates
 *
 * @param _ctx - Tenant context (unused for system content, but maintains consistent API)
 * @param options - Filter options (activeOnly)
 * @returns List of templates
 */
export async function listTemplatesService(
  _ctx: TenantContext,
  options?: { activeOnly?: boolean }
): Promise<AssessmentTemplate[]> {
  const db = getDb();

  return await templateRepository.findAll(db, options);
}
