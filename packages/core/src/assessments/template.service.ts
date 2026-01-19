import { eq } from 'drizzle-orm';

import { getDb, type DbClient } from '@ffp/database';
import { templateQuestions } from '@ffp/database/schema';

import { isUserActor, type TenantContext } from '../lib/context';
import { NotFoundError, UnauthorisedError, ValidationError } from '../lib/errors';
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
 */
export async function duplicateTemplateService(
  ctx: TenantContext,
  templateId: string,
  newName: string
): Promise<AssessmentTemplateWithQuestions> {
  const userId = getActorUserId(ctx);
  const db = getDb();

  // Fetch source template
  const sourceTemplate = await templateRepository.findById(db, templateId);

  if (!sourceTemplate) {
    throw new NotFoundError('Assessment template', templateId);
  }

  // Fetch source template's question assignments
  const sourceTemplateQuestions = await db
    .select()
    .from(templateQuestions)
    .where(eq(templateQuestions.templateId, templateId));

  // Create the duplicate template
  const duplicateInput: CreateAssessmentTemplateInput = {
    name: newName,
    description: sourceTemplate.description,
    version: 1,
    scoringConfig: sourceTemplate.scoringConfig,
    isActive: false, // Start as draft
    createdBy: userId,
  };

  const duplicatedTemplate = await templateRepository.create(db, duplicateInput);

  // Copy template_questions join records
  if (sourceTemplateQuestions.length > 0) {
    const newTemplateQuestions = sourceTemplateQuestions.map((tq) => ({
      templateId: duplicatedTemplate.id,
      questionId: tq.questionId,
      displayOrder: tq.displayOrder,
      configOverrides: tq.configOverrides,
    }));

    await db.insert(templateQuestions).values(newTemplateQuestions);
  }

  // Fetch and return the complete duplicated template with questions
  const result = await templateRepository.findWithQuestions(db, duplicatedTemplate.id);

  // Should never be null since we just created it
  if (!result) {
    throw new Error('Failed to fetch duplicated template');
  }

  return result;
}

/**
 * Get an assessment template by ID with questions
 *
 * Fetches template and its associated questions via template_questions join.
 */
export async function getTemplateService(
  db: DbClient,
  templateId: string
): Promise<AssessmentTemplateWithQuestions | null> {
  return await templateRepository.findWithQuestions(db, templateId);
}

/**
 * List assessment templates
 */
export async function listTemplatesService(
  db: DbClient,
  options?: { activeOnly?: boolean }
): Promise<AssessmentTemplate[]> {
  return await templateRepository.findAll(db, options);
}
