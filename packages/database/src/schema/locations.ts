import { pgTable, uuid, varchar, timestamp, jsonb, pgEnum, index } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { relations } from 'drizzle-orm';
import { organisations } from './organisations';
import { LOCATION_STATUSES } from '../constants/location.constants';

export const locationStatusEnum = pgEnum('location_status', [...LOCATION_STATUSES]);

/**
 * Locations table definition
 * Represents branches/sites within a business organisation
 */
export const locations = pgTable(
  'locations',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organisationId: uuid('organisation_id')
      .notNull()
      .references(() => organisations.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 255 }).notNull(),
    accountCode: varchar('account_code', { length: 50 }).notNull().unique(),
    address: jsonb('address').$type<{
      line1?: string;
      line2?: string;
      city?: string;
      county?: string;
      postcode?: string;
      country?: string;
    }>(),
    status: locationStatusEnum('status').notNull().default('active'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [
    index('idx_locations_organisation_id').on(table.organisationId),
    index('idx_locations_account_code').on(table.accountCode),
    index('idx_locations_status').on(table.status),
  ]
);

export const locationsRelations = relations(locations, ({ one }) => ({
  organisation: one(organisations, {
    fields: [locations.organisationId],
    references: [organisations.id],
  }),
}));

export const insertLocationSchema = createInsertSchema(locations);
export const selectLocationSchema = createSelectSchema(locations);
export type Location = typeof locations.$inferSelect;
export type NewLocation = typeof locations.$inferInsert;
