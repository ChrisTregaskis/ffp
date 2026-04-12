import {
  pgTable,
  uuid,
  varchar,
  integer,
  timestamp,
  uniqueIndex,
  index,
  pgEnum,
} from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { PHASE_STATUSES } from '../constants/programme.constants';
import { publicIdColumn, publicIdIndex } from '../lib/public-id';
import { organisations } from './organisations';
import { programmes } from './programmes';
import { templatePhases } from './template-phases';

export const phaseStatusEnum = pgEnum('phase_status', [...PHASE_STATUSES]);

/**
 * Programme phases table definition
 *
 * User-layer phase instances created eagerly at programme assignment time.
 * Each row represents a user's copy of a template phase, tracking their
 * progress through the programme structure.
 *
 * **RLS enforced** — organisation_id column with row-level security policies.
 */
export const programmePhases = pgTable(
  'programme_phases',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    publicId: publicIdColumn(),
    /** Organisation for RLS isolation */
    organisationId: uuid('organisation_id')
      .notNull()
      .references(() => organisations.id, { onDelete: 'cascade' }),
    /** Parent programme */
    programmeId: uuid('programme_id')
      .notNull()
      .references(() => programmes.id, { onDelete: 'cascade' }),
    /** Source template phase — restrict deletion of templates with active programmes */
    templatePhaseId: uuid('template_phase_id')
      .notNull()
      .references(() => templatePhases.id, { onDelete: 'restrict' }),
    /** Ordinal position copied from template (1-based) */
    phaseNumber: integer('phase_number').notNull(),
    /** Display name copied from template phase */
    name: varchar('name', { length: 255 }),
    /** Phase completion status */
    status: phaseStatusEnum('status').notNull().default('not_started'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [
    publicIdIndex('programme_phases', table.publicId),
    uniqueIndex('idx_programme_phases_programme_phase').on(table.programmeId, table.phaseNumber),
    index('idx_programme_phases_organisation').on(table.organisationId),
    index('idx_programme_phases_programme').on(table.programmeId),
  ]
);

export const insertProgrammePhaseSchema = createInsertSchema(programmePhases);
export const selectProgrammePhaseSchema = createSelectSchema(programmePhases);
export type ProgrammePhaseRecord = typeof programmePhases.$inferSelect;
export type NewProgrammePhase = typeof programmePhases.$inferInsert;
