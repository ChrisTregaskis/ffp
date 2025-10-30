/**
 * Database Schema Exports
 *
 * Central export point for all Drizzle schema definitions.
 * This allows importing all schemas from a single location.
 *
 * @module schema
 */

// Tenants
export {
  tenants,
  tenantsRelations,
  tenantTypeEnum,
  insertTenantSchema,
  selectTenantSchema,
  type Tenant,
  type NewTenant,
} from './tenants';

// Customers
export {
  customers,
  customersRelations,
  customerStatusEnum,
  insertCustomerSchema,
  selectCustomerSchema,
  type Customer,
  type NewCustomer,
} from './customers';

// Users
export {
  users,
  usersRelations,
  userRoleEnum,
  insertUserSchema,
  selectUserSchema,
  type User,
  type NewUser,
} from './users';
