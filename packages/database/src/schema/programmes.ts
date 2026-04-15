import {
  pgTable,
  uuid,
  varchar,
  text,
  integer,
  timestamp,
  index,
  pgEnum,
  type AnyPgColumn,
} from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { relations } from 'drizzle-orm';
import { organisations } from './organisations';
import { users } from './users';
import { programmeTemplates } from './programme-templates';
import { PROGRAMME_STATUSES } from '../constants/programme.constants';
import { publicIdColumn, publicIdIndex } from '../lib/public-id';

export const programmeStatusEnum = pgEnum('programme_status', [...PROGRAMME_STATUSES]);

/**
 * Programmes table definition
 *
 * Stores generated workout programmes created from assessment scoring results.
 * Each programme is linked to a user and references the template used for generation.
 *
 * **Indexes optimised for common queries:**
 * - organisation_user: Find all programmes for a user within an organisation
 * - status: Filter by programme status (e.g., find all active)
 * - template: Find programmes generated from a specific template
 */
export const programmes = pgTable(
  'programmes',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    publicId: publicIdColumn(),
    organisationId: uuid('organisation_id')
      .notNull()
      .references(() => organisations.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    /** Reference to the programme template used for generation */
    programmeTemplateId: uuid('programme_template_id')
      .notNull()
      .references(() => programmeTemplates.id, { onDelete: 'restrict' }),
    /** Display name for the programme */
    name: varchar('name', { length: 255 }).notNull(),
    /** Optional description of the programme */
    description: text('description'),
    /** Programme lifecycle status */
    status: programmeStatusEnum('status').notNull().default('active'),
    /** When the user first started a session */
    startedAt: timestamp('started_at'),
    /** When all phases/sessions were completed */
    completedAt: timestamp('completed_at'),
    /** When the programme was archived */
    archivedAt: timestamp('archived_at'),
    /** Why archived: reassessment, manual, expired */
    archivedReason: varchar('archived_reason', { length: 50 }),
    /** Successor programme (self-referential linked list of programme history) */
    replacedByProgrammeId: uuid('replaced_by_programme_id').references(
      (): AnyPgColumn => programmes.id,
      { onDelete: 'set null' }
    ),
    /** Snapshot of template's total phases at assignment time */
    totalPhases: integer('total_phases'),
    /** Snapshot of template's sessions per phase at assignment time */
    sessionsPerPhase: integer('sessions_per_phase'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [
    publicIdIndex('programmes', table.publicId),
    index('idx_programmes_organisation_user').on(table.organisationId, table.userId),
    index('idx_programmes_status').on(table.status),
    index('idx_programmes_template').on(table.programmeTemplateId),
  ]
);

export const programmesRelations = relations(programmes, ({ one }) => ({
  organisation: one(organisations, {
    fields: [programmes.organisationId],
    references: [organisations.id],
  }),
  user: one(users, {
    fields: [programmes.userId],
    references: [users.id],
  }),
  template: one(programmeTemplates, {
    fields: [programmes.programmeTemplateId],
    references: [programmeTemplates.id],
  }),
  replacedByProgramme: one(programmes, {
    fields: [programmes.replacedByProgrammeId],
    references: [programmes.id],
    relationName: 'programmeReplacement',
  }),
}));

export const insertProgrammeSchema = createInsertSchema(programmes);
export const selectProgrammeSchema = createSelectSchema(programmes);
export type ProgrammeRecord = typeof programmes.$inferSelect;
export type NewProgramme = typeof programmes.$inferInsert;
