import { z } from 'zod';

import { TAG_CATEGORY_SLUGS } from '@ffp/database/constants';

import { QUESTION_SLUG_PATTERN } from './assessment-question.schema';
import { publicIdSchema } from './public-id.schema';

/** `tags.slug` and `tags.label` are varchar(100). */
export const TAG_TEXT_MAX_LENGTH = 100;

export const tagCategorySlugSchema = z.enum(TAG_CATEGORY_SLUGS);

const tagSlugSchema = z
  .string()
  .min(1, 'Slug is required')
  .max(TAG_TEXT_MAX_LENGTH, `Slug must be ${String(TAG_TEXT_MAX_LENGTH)} characters or fewer`)
  .regex(
    QUESTION_SLUG_PATTERN,
    'Slug must be kebab-case (lowercase letters, digits and single hyphens)'
  );

const tagLabelSchema = z
  .string()
  .trim()
  .min(1, 'Label is required')
  .max(TAG_TEXT_MAX_LENGTH, `Label must be ${String(TAG_TEXT_MAX_LENGTH)} characters or fewer`);

/** A tag as a video carries it */
export const tagSummarySchema = z.object({
  publicId: publicIdSchema,
  slug: z.string(),
  label: z.string(),
});

/** A tag in the admin vocabulary, inactive ones included */
export const adminTagSchema = tagSummarySchema.extend({
  category: tagCategorySlugSchema,
  isActive: z.boolean(),
});

export const adminTagCategorySchema = z.object({
  slug: tagCategorySlugSchema,
  label: z.string(),
  tags: z.array(adminTagSchema),
});

export const adminTagCategoryListResponseSchema = z.object({
  categories: z.array(adminTagCategorySchema),
});

export const adminTagResponseSchema = z.object({
  tag: adminTagSchema,
});

export const createTagSchema = z.object({
  category: tagCategorySlugSchema,
  slug: tagSlugSchema,
  label: tagLabelSchema,
});

/** `slug` and `category` are immutable. */
export const updateTagSchema = z
  .object({
    label: tagLabelSchema,
    isActive: z.boolean(),
  })
  .partial();

/** A video's tags, every category present */
export const videoTagsSchema = z.record(tagCategorySlugSchema, z.array(tagSummarySchema));

/**
 * Tag publicIds per category. A category sent replaces that category's tags on the video; a
 * category left out is untouched.
 */
export const videoTagAssignmentSchema = z.partialRecord(
  tagCategorySlugSchema,
  z.array(publicIdSchema)
);

export type TagCategorySlug = z.infer<typeof tagCategorySlugSchema>;
export type TagSummary = z.infer<typeof tagSummarySchema>;
export type AdminTag = z.infer<typeof adminTagSchema>;
export type AdminTagCategory = z.infer<typeof adminTagCategorySchema>;
export type AdminTagCategoryListResponse = z.infer<typeof adminTagCategoryListResponseSchema>;
export type AdminTagResponse = z.infer<typeof adminTagResponseSchema>;
export type VideoTags = z.infer<typeof videoTagsSchema>;
export type VideoTagAssignment = z.infer<typeof videoTagAssignmentSchema>;
export type CreateTagInput = z.infer<typeof createTagSchema>;
export type UpdateTagInput = z.infer<typeof updateTagSchema>;
