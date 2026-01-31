import { pgTable, uuid, varchar, text, timestamp, index, pgEnum } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { relations } from 'drizzle-orm';
import { tenants } from './tenants';
import { users } from './users';
import { programmeTemplates } from './programme-templates';
import { PROGRAMME_STATUSES } from '../constants/programme.constants';

export const programmeStatusEnum = pgEnum('programme_status', [...PROGRAMME_STATUSES]);

/**
 * Programmes table definition
 *
 * Stores generated workout programmes created from assessment scoring results.
 * Each programme is linked to a user and references the template used for generation.
 *
 * **Indexes optimised for common queries:**
 * - tenant_user: Find all programmes for a user within a tenant
 * - status: Filter by programme status (e.g., find all active)
 * - template: Find programmes generated from a specific template
 */
export const programmes = pgTable(
  'programmes',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
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
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [
    index('idx_programmes_tenant_user').on(table.tenantId, table.userId),
    index('idx_programmes_status').on(table.status),
    index('idx_programmes_template').on(table.programmeTemplateId),
  ]
);

/**
 * Relations definition for programmes
 * - Belongs to a tenant (for RLS isolation)
 * - Belongs to a user
 * - References a programme template
 */
export const programmesRelations = relations(programmes, ({ one }) => ({
  tenant: one(tenants, {
    fields: [programmes.tenantId],
    references: [tenants.id],
  }),
  user: one(users, {
    fields: [programmes.userId],
    references: [users.id],
  }),
  template: one(programmeTemplates, {
    fields: [programmes.programmeTemplateId],
    references: [programmeTemplates.id],
  }),
}));

export const insertProgrammeSchema = createInsertSchema(programmes);
export const selectProgrammeSchema = createSelectSchema(programmes);
export type ProgrammeRecord = typeof programmes.$inferSelect;
export type NewProgramme = typeof programmes.$inferInsert;
