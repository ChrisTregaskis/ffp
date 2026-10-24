import { relations } from 'drizzle-orm';
import {
  pgTable,
  uuid,
  varchar,
  integer,
  boolean,
  timestamp,
  uniqueIndex,
  index,
} from 'drizzle-orm/pg-core';

import { publicIdColumn, publicIdIndex } from '../lib/public-id';

import { videos } from './videos';

/** The axes videos are tagged by. Seeded, not admin-authored; system catalogue, no RLS. */
export const tagCategories = pgTable(
  'tag_categories',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    publicId: publicIdColumn(),
    /** Stable identifier (e.g., 'body-area') */
    slug: varchar('slug', { length: 50 }).notNull().unique(),
    /** Display name (e.g., 'Body area') */
    label: varchar('label', { length: 100 }).notNull(),
    displayOrder: integer('display_order').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [publicIdIndex('tag_categories', table.publicId)]
);

/** Tags within a category. Deactivated, never deleted; system catalogue, no RLS. */
export const tags = pgTable(
  'tags',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    publicId: publicIdColumn(),
    categoryId: uuid('category_id')
      .notNull()
      .references(() => tagCategories.id, { onDelete: 'restrict' }),
    /** Identifier unique within the category (e.g., 'lower-back') */
    slug: varchar('slug', { length: 100 }).notNull(),
    /** Display name (e.g., 'Lower back') */
    label: varchar('label', { length: 100 }).notNull(),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    publicIdIndex('tags', table.publicId),
    // Slugs repeat across categories but never within one; also serves lookups by category
    uniqueIndex('idx_tags_category_slug').on(table.categoryId, table.slug),
  ]
);

/** A video may carry several tags per category. Tag deletes restrict; system catalogue, no RLS. */
export const videoTags = pgTable(
  'video_tags',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    videoId: uuid('video_id')
      .notNull()
      .references(() => videos.id, { onDelete: 'cascade' }),
    tagId: uuid('tag_id')
      .notNull()
      .references(() => tags.id, { onDelete: 'restrict' }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    // One row per video and tag; also serves "the tags on this video"
    uniqueIndex('idx_video_tags_video_tag').on(table.videoId, table.tagId),
    // Pool lookups start from a set of tags and need only the video id
    index('idx_video_tags_tag_video').on(table.tagId, table.videoId),
  ]
);

export const tagCategoriesRelations = relations(tagCategories, ({ many }) => ({
  tags: many(tags),
}));

export const tagsRelations = relations(tags, ({ one, many }) => ({
  category: one(tagCategories, { fields: [tags.categoryId], references: [tagCategories.id] }),
  videoTags: many(videoTags),
}));

export const videoTagsRelations = relations(videoTags, ({ one }) => ({
  video: one(videos, { fields: [videoTags.videoId], references: [videos.id] }),
  tag: one(tags, { fields: [videoTags.tagId], references: [tags.id] }),
}));

export type TagCategoryRecord = typeof tagCategories.$inferSelect;
export type TagRecord = typeof tags.$inferSelect;
export type NewTag = typeof tags.$inferInsert;
