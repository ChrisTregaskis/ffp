import { getDb, type DbClient } from '@ffp/database';

import { type OrganisationContext } from '../lib/context';
import { ConflictError, NotFoundError, ValidationError } from '../lib/errors';
import {
  adminTagSchema,
  createTagSchema,
  updateTagSchema,
  type AdminTag,
  type AdminTagCategory,
} from '../schemas/tag.schema';

import * as tagRepository from './tag.repository';

/** Categories in display order, each with every tag. `_ctx` is unused: tags are catalogue content. */
export async function listTagCategoriesService(
  _ctx: OrganisationContext
): Promise<AdminTagCategory[]> {
  const db = getDb();

  const [categories, allTags] = await Promise.all([
    tagRepository.findCategories(db),
    tagRepository.findAllTags(db),
  ]);

  return categories.map((category) => ({
    slug: adminTagSchema.shape.category.parse(category.slug),
    label: category.label,
    tags: allTags
      .filter((tag) => tag.categoryId === category.id)
      .map((tag) => adminTagSchema.parse(tag)),
  }));
}

async function getAdminTag(db: DbClient, publicId: string): Promise<AdminTag> {
  const tag = await tagRepository.findTagByPublicId(db, publicId);

  if (!tag) {
    throw new NotFoundError('Tag', publicId);
  }

  return adminTagSchema.parse(tag);
}

/** Create a tag in a category. Slugs are unique within the category (409 on collision). */
export async function createTagService(
  _ctx: OrganisationContext,
  input: unknown
): Promise<AdminTag> {
  const parseResult = createTagSchema.safeParse(input);

  if (!parseResult.success) {
    throw new ValidationError('Invalid tag input', { errors: parseResult.error.issues });
  }

  const { category: categorySlug, slug, label } = parseResult.data;
  const db = getDb();

  const category = await tagRepository.findCategoryBySlug(db, categorySlug);

  if (!category) {
    throw new NotFoundError('Tag category', categorySlug);
  }

  const existing = await tagRepository.findTagBySlug(db, category.id, slug);

  if (existing) {
    throw new ConflictError('A tag with this slug already exists in the category', {
      category: categorySlug,
      slug,
    });
  }

  const { publicId } = await tagRepository.insertTag(db, { categoryId: category.id, slug, label });

  return await getAdminTag(db, publicId);
}

/** Update a tag's label or active flag, resolved by public identifier. */
export async function updateTagService(
  _ctx: OrganisationContext,
  publicId: string,
  input: unknown
): Promise<AdminTag> {
  const parseResult = updateTagSchema.safeParse(input);

  if (!parseResult.success) {
    throw new ValidationError('Invalid tag update input', { errors: parseResult.error.issues });
  }

  const db = getDb();
  const tag = await tagRepository.findTagByPublicId(db, publicId);

  if (!tag) {
    throw new NotFoundError('Tag', publicId);
  }

  await tagRepository.updateTag(db, tag.id, parseResult.data);

  return await getAdminTag(db, publicId);
}

/**
 * Deactivate a tag (soft delete), resolved by public identifier. Videos keep it, but it leaves
 * every pool and can't be newly assigned.
 */
export async function deactivateTagService(
  _ctx: OrganisationContext,
  publicId: string
): Promise<void> {
  const db = getDb();
  const tag = await tagRepository.findTagByPublicId(db, publicId);

  if (!tag) {
    throw new NotFoundError('Tag', publicId);
  }

  await tagRepository.updateTag(db, tag.id, { isActive: false });
}
