import {
  pgTable,
  uuid,
  varchar,
  integer,
  boolean,
  timestamp,
  uniqueIndex,
  index,
  primaryKey,
} from 'drizzle-orm/pg-core';
import { publicIdColumn, publicIdIndex } from '../lib/public-id';
import { tagCategories, tags } from './tags';
import { templateSessions } from './template-sessions';

/**
 * A position in a template session that draws one exercise from a tagged pool: active videos
 * carrying an active tag in the slot's category, narrowed to the slot's tags when it names any.
 * A required slot must fill. System catalogue, no RLS.
 */
export const templateSessionSlots = pgTable(
  'template_session_slots',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    publicId: publicIdColumn(),
    templateSessionId: uuid('template_session_id')
      .notNull()
      .references(() => templateSessions.id, { onDelete: 'cascade' }),
    /** Display order within the session (0-based) */
    orderIndex: integer('order_index').notNull(),
    tagCategoryId: uuid('tag_category_id')
      .notNull()
      .references(() => tagCategories.id, { onDelete: 'restrict' }),
    isRequired: boolean('is_required').notNull().default(true),
    /** Display only (e.g., 'Warm-up'); the pool is defined by category and tags alone */
    label: varchar('label', { length: 100 }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    publicIdIndex('template_session_slots', table.publicId),
    // Also serves "the slots of this session"
    uniqueIndex('idx_template_session_slots_session_order').on(
      table.templateSessionId,
      table.orderIndex
    ),
    index('idx_template_session_slots_category').on(table.tagCategoryId),
  ]
);

/** The tags a slot narrows its pool to; none means the whole category. Tag deletes restrict. */
export const templateSlotTags = pgTable(
  'template_slot_tags',
  {
    slotId: uuid('slot_id')
      .notNull()
      .references(() => templateSessionSlots.id, { onDelete: 'cascade' }),
    tagId: uuid('tag_id')
      .notNull()
      .references(() => tags.id, { onDelete: 'restrict' }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.slotId, table.tagId] }),
    index('idx_template_slot_tags_tag').on(table.tagId),
  ]
);

export type TemplateSessionSlotRecord = typeof templateSessionSlots.$inferSelect;
