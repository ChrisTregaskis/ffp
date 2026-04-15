import { pgTable, uuid, varchar, timestamp, date, text, pgEnum, index } from 'drizzle-orm/pg-core';

import { publicIdColumn, publicIdIndex } from '../lib/public-id';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { relations } from 'drizzle-orm';
import { organisations } from './organisations';
import { locations } from './locations';
import { USER_ROLES } from '../constants/user.constants';

export const userRoleEnum = pgEnum('user_role', [...USER_ROLES]);

/**
 * Users table definition
 * RLS enabled to enforce organisation isolation (see migrations)
 */
export const users = pgTable(
  'users',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    publicId: publicIdColumn(),
    organisationId: uuid('organisation_id')
      .notNull()
      .references(() => organisations.id, { onDelete: 'cascade' }),
    email: varchar('email', { length: 255 }).notNull().unique(),
    cognitoSub: varchar('cognito_sub', { length: 255 }).notNull().unique(),
    firstName: varchar('first_name', { length: 100 }).notNull(),
    lastName: varchar('last_name', { length: 100 }).notNull(),
    role: userRoleEnum('role').notNull(),
    // Foreign key to location (for business users only, null for individual users)
    locationId: uuid('location_id').references(() => locations.id, {
      onDelete: 'cascade',
    }),
    profileImageUrl: text('profile_image_url'),
    phone: varchar('phone', { length: 20 }),
    dateOfBirth: date('date_of_birth'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [
    publicIdIndex('users', table.publicId),
    index('idx_users_organisation_id').on(table.organisationId),
    index('idx_users_email').on(table.email),
    index('idx_users_location_id').on(table.locationId),
  ]
);

export const usersRelations = relations(users, ({ one }) => ({
  organisation: one(organisations, {
    fields: [users.organisationId],
    references: [organisations.id],
  }),
  location: one(locations, {
    fields: [users.locationId],
    references: [locations.id],
  }),
}));

export const insertUserSchema = createInsertSchema(users);
export const selectUserSchema = createSelectSchema(users);
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
