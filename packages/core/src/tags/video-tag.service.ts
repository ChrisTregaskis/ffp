import type { DbQueryClient } from '@ffp/database';
import { TAG_CATEGORY_SLUGS, type TagCategorySlug } from '@ffp/database/constants';

import { ValidationError } from '../lib/errors';

import * as tagRepository from './tag.repository';

import type { VideoTagAssignment, VideoTags } from '../schemas/tag.schema';

/** Tag ids per category, checked and ready to write */
export interface ResolvedTagAssignment {
  categoryId: string;
  tagIds: string[];
}

const emptyVideoTags = (): VideoTags =>
  Object.fromEntries(TAG_CATEGORY_SLUGS.map((slug) => [slug, []])) as unknown as VideoTags;

/** Each video's tags by category; a video with none still gets every category, empty. */
export async function findTagsByVideoId(
  db: DbQueryClient,
  videoIds: string[]
): Promise<Map<string, VideoTags>> {
  const rows = await tagRepository.findVideoTags(db, videoIds);
  const byVideo = new Map(videoIds.map((videoId) => [videoId, emptyVideoTags()]));

  for (const row of rows) {
    byVideo
      .get(row.videoId)
      ?.[row.category].push({ publicId: row.publicId, slug: row.slug, label: row.label });
  }

  return byVideo;
}

export async function findTagsOfVideo(db: DbQueryClient, videoId: string): Promise<VideoTags> {
  const byVideo = await findTagsByVideoId(db, [videoId]);

  return byVideo.get(videoId) ?? emptyVideoTags();
}

/**
 * Check an assignment against the vocabulary: every tag exists, sits in the category it was sent
 * under, and is active unless the video (or template slot) already carries it, so a deactivated
 * tag survives a re-save without being newly assignable.
 */
export async function resolveTagAssignment(
  db: DbQueryClient,
  assignment: VideoTagAssignment,
  currentTags?: Partial<VideoTags>
): Promise<ResolvedTagAssignment[]> {
  const sent = Object.entries(assignment) as [TagCategorySlug, string[]][];
  const publicIds = [...new Set(sent.flatMap(([, ids]) => ids))];

  const [categories, found] = await Promise.all([
    tagRepository.findCategories(db),
    tagRepository.findTagsByPublicIds(db, publicIds),
  ]);
  const tagsByPublicId = new Map(found.map((tag) => [tag.publicId, tag]));
  const carried = new Set(
    Object.values(currentTags ?? {}).flatMap((categoryTags) =>
      categoryTags.map((tag) => tag.publicId)
    )
  );

  const unknown = publicIds.filter((publicId) => !tagsByPublicId.has(publicId));

  if (unknown.length > 0) {
    throw new ValidationError('Unknown tags', { tags: unknown });
  }

  return sent.map(([categorySlug, ids]) => {
    const category = categories.find((candidate) => candidate.slug === categorySlug);

    if (!category) {
      throw new ValidationError('Unknown tag category', { category: categorySlug });
    }

    // Unknown publicIds were refused above, so every lookup finds its tag
    const tags = [...new Set(ids)].flatMap((publicId) => tagsByPublicId.get(publicId) ?? []);
    const misplaced = tags.filter((tag) => tag.category !== categorySlug);
    const inactive = tags.filter((tag) => !tag.isActive && !carried.has(tag.publicId));

    if (misplaced.length > 0) {
      throw new ValidationError(`Tags are not in the ${categorySlug} category`, {
        tags: misplaced.map((tag) => tag.publicId),
      });
    }

    if (inactive.length > 0) {
      throw new ValidationError('Inactive tags cannot be assigned', {
        tags: inactive.map((tag) => tag.publicId),
      });
    }

    return { categoryId: category.id, tagIds: tags.map((tag) => tag.id) };
  });
}

export async function writeTagAssignment(
  db: DbQueryClient,
  videoId: string,
  resolved: ResolvedTagAssignment[]
): Promise<void> {
  for (const { categoryId, tagIds } of resolved) {
    await tagRepository.replaceVideoTagsInCategory(db, videoId, categoryId, tagIds);
  }
}
