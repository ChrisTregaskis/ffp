import { getDb, type DbClient } from '@ffp/database';

import { getUserIdFromContext, type OrganisationContext } from '../lib/context';
import { InternalServerError, NotFoundError, ValidationError } from '../lib/errors';
import * as questionRepository from '../questions/question.repository';
import {
  adminAssessmentTemplateDetailSchema,
  assessmentTemplateListItemSchema,
  createAssessmentTemplateSchema,
  updateAssessmentTemplateSchema,
  type AdminAssessmentTemplateDetail,
  type AssessmentTemplate,
  type AssessmentTemplateListFilters,
  type AssessmentTemplateListItem,
  type CreateAssessmentTemplateRequest,
  type UpdateAssessmentTemplateInput,
} from '../schemas/assessment-template.schema';
import {
  buildPaginationMeta,
  type PaginationInput,
  type PaginationMeta,
} from '../schemas/pagination.schema';

import * as templateRepository from './template.repository';

import type { AssessmentTemplateWithQuestions } from './template.repository';

export type { AssessmentTemplate, AssessmentTemplateWithQuestions };
export type CreateTemplateInput = CreateAssessmentTemplateRequest;

/**
 * Resolve a template by public identifier or throw 404 — the one lookup every
 * admin route on the template and its questions keys on. Not filtered on
 * `isActive`: a deactivated template can still be read, edited and recomposed,
 * so it can be fixed up before being activated again.
 */
export async function resolveTemplate(
  db: DbClient,
  templatePublicId: string
): Promise<AssessmentTemplate> {
  const template = await templateRepository.findTemplateByPublicId(db, templatePublicId);

  if (!template) {
    throw new NotFoundError('Assessment template', templatePublicId);
  }

  return template;
}

/** List templates for the admin surface — one page, filtered. `_ctx` is unused: templates are catalogue content. */
export async function listTemplatesService(
  _ctx: OrganisationContext,
  paginationInput: PaginationInput,
  filters: AssessmentTemplateListFilters
): Promise<{ data: AssessmentTemplateListItem[]; pagination: PaginationMeta }> {
  const db = getDb();

  const records = await templateRepository.findTemplatePage(db, paginationInput, filters);
  const total = await templateRepository.countTemplates(db, filters);

  return {
    data: records.map((record) => assessmentTemplateListItemSchema.parse(record)),
    pagination: buildPaginationMeta(paginationInput, total),
  };
}

/** The admin read of one template, by public identifier: the row, its questions, and the flows using it. */
export async function getAdminTemplateService(
  _ctx: OrganisationContext,
  templatePublicId: string
): Promise<AdminAssessmentTemplateDetail> {
  const db = getDb();
  const template = await resolveTemplate(db, templatePublicId);

  const [templateQuestions, flows] = await Promise.all([
    questionRepository.findByTemplateId(db, template.id),
    templateRepository.findTemplateFlowUsage(db, template.id),
  ]);

  return adminAssessmentTemplateDetailSchema.parse({ ...template, templateQuestions, flows });
}

/** Create a new assessment template */
export async function createTemplateService(
  ctx: OrganisationContext,
  input: CreateTemplateInput
): Promise<AssessmentTemplate> {
  const userId = await getUserIdFromContext(ctx);

  const parseResult = createAssessmentTemplateSchema.safeParse({ ...input, createdBy: userId });

  if (!parseResult.success) {
    throw new ValidationError('Invalid template input', {
      errors: parseResult.error.issues,
    });
  }

  const db = getDb();

  return await templateRepository.createTemplate(db, parseResult.data);
}

/** Update an existing assessment template, resolved by public identifier. */
export async function updateTemplateService(
  _ctx: OrganisationContext,
  templatePublicId: string,
  input: UpdateAssessmentTemplateInput
): Promise<AssessmentTemplate> {
  // Validate against Zod schema
  const parseResult = updateAssessmentTemplateSchema.safeParse(input);

  if (!parseResult.success) {
    throw new ValidationError('Invalid template update input', {
      errors: parseResult.error.issues,
    });
  }

  const db = getDb();
  const template = await resolveTemplate(db, templatePublicId);

  return await templateRepository.updateTemplate(db, template.id, parseResult.data);
}

/** Deactivate an assessment template (soft delete), resolved by public identifier. */
export async function deactivateTemplateService(
  _ctx: OrganisationContext,
  templatePublicId: string
): Promise<void> {
  const db = getDb();
  const template = await resolveTemplate(db, templatePublicId);

  await templateRepository.deactivateTemplate(db, template.id);
}

/** Duplicate an assessment template, resolved by public identifier. */
export async function duplicateTemplateService(
  ctx: OrganisationContext,
  templatePublicId: string,
  newName: string
): Promise<AssessmentTemplateWithQuestions> {
  const userId = await getUserIdFromContext(ctx);
  const db = getDb();

  const sourceTemplate = await resolveTemplate(db, templatePublicId);

  // Fetch source template's question assignments
  const sourceTemplateQuestions = await templateRepository.findQuestionAssignmentsByTemplateId(
    db,
    sourceTemplate.id
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
 * Get an assessment template by UUID with questions — the member's read, keyed
 * by the UUID their flow step carries (`flow_steps.template_id`). Only active questions are
 * shown: a deactivated one still assigned is left out, as validation and scoring leave it out.
 * @param _ctx - Organisation context (unused for system content, but maintains consistent API)
 */
export async function getTemplateService(
  _ctx: OrganisationContext,
  templateId: string
): Promise<AssessmentTemplateWithQuestions | null> {
  const db = getDb();
  const template = await templateRepository.findTemplateWithQuestions(db, templateId);

  return (
    template && {
      ...template,
      templateQuestions: template.templateQuestions.filter((question) => question.isActive),
    }
  );
}
