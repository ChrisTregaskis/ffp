/**
 * Customers Table Schema
 *
 * Defines the customers table for business accounts (billing entities).
 * A customer represents a business organisation that is billed for services.
 * Individual tenants do not have customer records.
 *
 * @module schema/customers
 */

import { pgTable, uuid, varchar, timestamp, jsonb, pgEnum, index } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { relations } from 'drizzle-orm';
import { tenants } from './tenants';
import { CUSTOMER_STATUSES } from '../constants/customer.constants';

/**
 * Customer status enumeration (PostgreSQL enum)
 *
 * Uses shared constants from @ffp/database/constants/customer.constants.ts
 * to ensure synchronisation with Zod schemas in @ffp/core.
 *
 * Defines the lifecycle states of a customer account:
 * - active: Customer account is active and can access the platform
 * - suspended: Temporarily suspended (e.g., payment issues, policy violation)
 * - inactive: Closed/cancelled account (data retained for compliance)
 */
export const customerStatusEnum = pgEnum('customer_status', [...CUSTOMER_STATUSES]);

/**
 * Customers table definition
 * Represents business organisations that are billed for services
 */
export const customers = pgTable(
  'customers',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
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
    status: customerStatusEnum('status').notNull().default('active'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [
    index('idx_customers_tenant_id').on(table.tenantId),
    index('idx_customers_account_code').on(table.accountCode),
    index('idx_customers_status').on(table.status),
  ]
);

/**
 * Relations definition for customers
 * A customer belongs to a tenant and has many users
 */
export const customersRelations = relations(customers, ({ one }) => ({
  tenant: one(tenants, {
    fields: [customers.tenantId],
    references: [tenants.id],
  }),
  // Users will reference this via customerId foreign key
}));

/**
 * Zod schema for inserting a customer
 * Auto-generated from Drizzle schema for validation
 */
export const insertCustomerSchema = createInsertSchema(customers);

/**
 * Zod schema for selecting a customer
 * Auto-generated from Drizzle schema for validation
 */
export const selectCustomerSchema = createSelectSchema(customers);

/**
 * TypeScript type for a customer record
 * Inferred from Drizzle schema
 */
export type Customer = typeof customers.$inferSelect;

/**
 * TypeScript type for creating a new customer
 * Inferred from Drizzle schema
 */
export type NewCustomer = typeof customers.$inferInsert;
