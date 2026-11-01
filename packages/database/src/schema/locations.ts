import { relations } from 'drizzle-orm';
import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  jsonb,
  pgEnum,
  index,
  unique,
} from 'drizzle-orm/pg-core';

import { LOCATION_STATUSES } from '../constants/location.constants';
import { publicIdColumn, publicIdIndex } from '../lib/public-id';

import { organisations } from './organisations';

export const locationStatusEnum = pgEnum('location_status', [...LOCATION_STATUSES]);

/**
 * Locations table definition
 * Represents branches/sites within a business organisation
 */
export const locations = pgTable(
  'locations',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    publicId: publicIdColumn(),
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
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    publicIdIndex('locations', table.publicId),
    index('idx_locations_organisation_id').on(table.organisationId),
    index('idx_locations_account_code').on(table.accountCode),
    index('idx_locations_status').on(table.status),
    unique('locations_id_organisation_id_unique').on(table.id, table.organisationId),
  ]
);

export const locationsRelations = relations(locations, ({ one }) => ({
  organisation: one(organisations, {
    fields: [locations.organisationId],
    references: [organisations.id],
  }),
}));

export type Location = typeof locations.$inferSelect;
export type NewLocation = typeof locations.$inferInsert;
