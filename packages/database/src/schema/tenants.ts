/**
 * Tenants Table Schema
 *
 * Defines the tenants table for multi-tenant data isolation.
 * Each tenant represents either an individual user or a business organisation.
 *
 * @module schema/tenants
 */

import { pgTable, uuid, varchar, timestamp, jsonb, pgEnum } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { relations } from 'drizzle-orm';
import { users } from './users';

/**
 * Tenant type enumeration
 * - individual: Single user account
 * - business: Organisation with multiple sub-customers
 * - platform: System platform tenant for super admins
 */
export const tenantTypeEnum = pgEnum('tenant_type', ['individual', 'business', 'platform']);

/**
 * Tenants table definition
 * Core table for multi-tenant architecture - no RLS needed as it's the root of tenant hierarchy
 */
export const tenants = pgTable('tenants', {
  id: uuid('id').primaryKey().defaultRandom(),
  type: tenantTypeEnum('type').notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  settings: jsonb('settings').default({}),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

/**
 * Relations definition for tenants
 * A tenant can have many users
 */
export const tenantsRelations = relations(tenants, ({ many }) => ({
  users: many(users),
}));

/**
 * Zod schema for inserting a tenant
 * Auto-generated from Drizzle schema for validation
 */
export const insertTenantSchema = createInsertSchema(tenants);

/**
 * Zod schema for selecting a tenant
 * Auto-generated from Drizzle schema for validation
 */
export const selectTenantSchema = createSelectSchema(tenants);

/**
 * TypeScript type for a tenant record
 * Inferred from Drizzle schema
 */
export type Tenant = typeof tenants.$inferSelect;

/**
 * TypeScript type for creating a new tenant
 * Inferred from Drizzle schema
 */
export type NewTenant = typeof tenants.$inferInsert;
