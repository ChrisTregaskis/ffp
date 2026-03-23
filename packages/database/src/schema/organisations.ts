import { pgTable, uuid, varchar, timestamp, jsonb, pgEnum } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { relations } from 'drizzle-orm';
import { users } from './users';
import { ORGANISATION_TYPES, ORGANISATION_STATUSES } from '../constants/organisation.constants';

export const organisationTypeEnum = pgEnum('organisation_type', [...ORGANISATION_TYPES]);
export const organisationStatusEnum = pgEnum('organisation_status', [...ORGANISATION_STATUSES]);

/**
 * Organisations table definition
 * Core table for multi-tenant architecture - no RLS needed as it's the root of organisation hierarchy
 */
export const organisations = pgTable('organisations', {
  id: uuid('id').primaryKey().defaultRandom(),
  type: organisationTypeEnum('type').notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  status: organisationStatusEnum('status').notNull().default('active'),
  settings: jsonb('settings').default({}),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const organisationsRelations = relations(organisations, ({ many }) => ({
  users: many(users),
}));

export const insertOrganisationSchema = createInsertSchema(organisations);
export const selectOrganisationSchema = createSelectSchema(organisations);
export type Organisation = typeof organisations.$inferSelect;
export type NewOrganisation = typeof organisations.$inferInsert;
