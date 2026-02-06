/**
 * Users Table Schema
 *
 * Defines the users table with Row-Level Security for multi-tenant isolation.
 * Users belong to a tenant and may have hierarchical relationships (business owner → sub-users).
 *
 * @module schema/users
 */

import { pgTable, uuid, varchar, timestamp, date, text, pgEnum, index } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { relations } from 'drizzle-orm';
import { tenants } from './tenants';
import { customers } from './customers';
import { USER_ROLES } from '../constants/user.constants';

/**
 * User role enumeration (PostgreSQL enum)
 *
 * Uses shared constants from @ffp/database/constants/user.constants.ts
 * to ensure synchronisation with Zod schemas in @ffp/core.
 *
 * Defines the hierarchical role system:
 * - system_admin: Platform administrator (highest privilege)
 * - customer_owner: Owner of a customer account (business)
 * - customer_admin: Administrator within a customer organisation
 * - programme_user: User accessing workout programmes (individual or customer user)
 *   - Individual users: customerId = null
 *   - Customer users: customerId present
 */
export const userRoleEnum = pgEnum('user_role', [...USER_ROLES]);

/**
 * Users table definition
 * RLS enabled to enforce tenant isolation (see migrations)
 */
export const users = pgTable(
  'users',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    email: varchar('email', { length: 255 }).notNull().unique(),
    cognitoSub: varchar('cognito_sub', { length: 255 }).notNull().unique(),
    firstName: varchar('first_name', { length: 100 }).notNull(),
    lastName: varchar('last_name', { length: 100 }).notNull(),
    role: userRoleEnum('role').notNull(),
    // Foreign key to customer (for business users only, null for individual users)
    customerId: uuid('customer_id').references(() => customers.id, {
      onDelete: 'cascade',
    }),
    profileImageUrl: text('profile_image_url'),
    phone: varchar('phone', { length: 20 }),
    dateOfBirth: date('date_of_birth'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [
    index('idx_users_tenant_id').on(table.tenantId),
    index('idx_users_email').on(table.email),
    index('idx_users_customer_id').on(table.customerId),
  ]
);

/**
 * Relations definition for users
 * - Belongs to a tenant
 * - May belong to a customer (for business users)
 */
export const usersRelations = relations(users, ({ one }) => ({
  tenant: one(tenants, {
    fields: [users.tenantId],
    references: [tenants.id],
  }),
  customer: one(customers, {
    fields: [users.customerId],
    references: [customers.id],
  }),
}));

/**
 * Zod schema for inserting a user
 * Auto-generated from Drizzle schema for validation
 */
export const insertUserSchema = createInsertSchema(users);

/**
 * Zod schema for selecting a user
 * Auto-generated from Drizzle schema for validation
 */
export const selectUserSchema = createSelectSchema(users);

/**
 * TypeScript type for a user record
 * Inferred from Drizzle schema
 */
export type User = typeof users.$inferSelect;

/**
 * TypeScript type for creating a new user
 * Inferred from Drizzle schema
 */
export type NewUser = typeof users.$inferInsert;
