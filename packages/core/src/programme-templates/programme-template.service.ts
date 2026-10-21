import { getDb, type DbClient } from '@ffp/database';

import * as flowRepository from '../assessments/flow.repository';
import { ConflictError, NotFoundError } from '../lib/errors';
import { buildPaginationMeta } from '../schemas/pagination.schema';
import {
  createProgrammeTemplateSchema,
  updateProgrammeTemplateSchema,
  templateListResponseSchema,
  templateDetailResponseSchema,
} from '../schemas/programme/programme.schema';

import * as templateRepository from './programme-template.repository';

import type { PaginationInput, PaginationMeta } from '../schemas/pagination.schema';
import type {
  TemplateListResponse,
  TemplateDetailResponse,
  TemplateListQuery,
} from '../schemas/programme/programme.schema';

/** Filter fields extracted from the full query (pagination fields handled separately) */
type TemplateFilters = Omit<TemplateListQuery, keyof PaginationInput>;

/**
 * Generation resolves a flow's recommendation by slug and refuses an inactive template, so a
 * template any flow recommends keeps its slug and stays active.
 */
async function assertNoFlowRecommends(
  db: DbClient,
  slug: string,
  refusal: "its slug can't change" | "it can't be deactivated"
): Promise<void> {
  const flowCount = await flowRepository.countFlowsRecommendingTemplate(db, slug);

  if (flowCount > 0) {
    const flows = flowCount === 1 ? '1 assessment flow' : `${String(flowCount)} assessment flows`;

    throw new ConflictError(`This programme is recommended by ${flows}, so ${refusal}`);
  }
}

/** Returns a paginated list of programme templates with optional filters. */
export async function listTemplates(
  paginationInput: PaginationInput,
  filters: TemplateFilters
): Promise<{ data: TemplateListResponse[]; pagination: PaginationMeta }> {
  const db = getDb();

  const records = await templateRepository.findAllTemplates(db, paginationInput, filters);
  const total = await templateRepository.countAllTemplates(db, filters);

  return {
    data: records.map((record) => templateListResponseSchema.parse(record)),
    pagination: buildPaginationMeta(paginationInput, total),
  };
}

/** Returns a single template with its full nested hierarchy. Resolved by public ID. */
export async function getTemplate(publicId: string): Promise<TemplateDetailResponse> {
  const db = getDb();
  const template = await templateRepository.findTemplateByPublicId(db, publicId);

  if (!template) {
    throw new NotFoundError('Programme template');
  }

  const hierarchy = await templateRepository.findTemplateHierarchy(db, template.id);

  return templateDetailResponseSchema.parse({
    ...template,
    ...hierarchy,
  });
}

/** Creates a new programme template with slug uniqueness enforcement. */
export async function createTemplate(input: unknown): Promise<TemplateDetailResponse> {
  const validated = createProgrammeTemplateSchema.parse(input);
  const db = getDb();

  const existing = await templateRepository.findTemplateBySlug(db, validated.slug);

  if (existing) {
    throw new ConflictError(`A programme template with slug '${validated.slug}' already exists`);
  }

  const record = await templateRepository.insertTemplate(db, validated);

  // New template has no phases yet
  return templateDetailResponseSchema.parse({
    ...record,
    phases: [],
  });
}

/** Updates a programme template with slug re-validation if changed. */
export async function updateTemplate(
  templateId: string,
  input: unknown
): Promise<TemplateDetailResponse> {
  const validated = updateProgrammeTemplateSchema.parse(input);
  const db = getDb();

  const existing = await templateRepository.findTemplateById(db, templateId);

  if (!existing) {
    throw new NotFoundError('Programme template');
  }

  if (validated.slug && validated.slug !== existing.slug) {
    await assertNoFlowRecommends(db, existing.slug, "its slug can't change");

    const slugHolder = await templateRepository.findTemplateBySlug(db, validated.slug);

    if (slugHolder) {
      throw new ConflictError(`A programme template with slug '${validated.slug}' already exists`);
    }
  }

  if (validated.isActive === false && existing.isActive) {
    await assertNoFlowRecommends(db, existing.slug, "it can't be deactivated");
  }

  const updated = await templateRepository.updateTemplate(db, templateId, validated);

  if (!updated) {
    throw new NotFoundError('Programme template');
  }

  const hierarchy = await templateRepository.findTemplateHierarchy(db, templateId);

  return templateDetailResponseSchema.parse({
    ...updated,
    ...hierarchy,
  });
}

/** Deactivates a programme template (sets isActive to false). */
export async function deactivateTemplate(templateId: string): Promise<TemplateDetailResponse> {
  const db = getDb();
  const existing = await templateRepository.findTemplateById(db, templateId);

  if (!existing) {
    throw new NotFoundError('Programme template');
  }

  if (existing.isActive) {
    await assertNoFlowRecommends(db, existing.slug, "it can't be deactivated");
  }

  const updated = await templateRepository.deactivateTemplate(db, templateId);

  if (!updated) {
    throw new NotFoundError('Programme template');
  }

  const hierarchy = await templateRepository.findTemplateHierarchy(db, templateId);

  return templateDetailResponseSchema.parse({
    ...updated,
    ...hierarchy,
  });
}
