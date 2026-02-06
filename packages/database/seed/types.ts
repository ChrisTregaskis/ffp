import type { Tenant, Customer, User } from '../src/schema/index.js';

/**
 * Utility type to convert Date fields to string (for JSON serialisation)
 * JSON cannot represent Date objects, so we store timestamps as ISO strings
 */
type DateFieldsToString<T> = {
  [K in keyof T]: T[K] extends Date ? string : T[K];
};

/**
 * Platform tenant seed data (from JSON config)
 * Same as Tenant type but with string timestamps for JSON compatibility
 */
export type PlatformTenantSeed = DateFieldsToString<Tenant>;

/**
 * Test customer tenant seed data (from JSON config)
 * Same as Tenant type but with string timestamps for JSON compatibility
 */
export type TestCustomerTenantSeed = DateFieldsToString<Tenant>;

/**
 * Test customer seed data (from JSON config)
 * Same as Customer type but with string timestamps for JSON compatibility
 */
export type TestCustomerSeed = DateFieldsToString<Customer>;

/**
 * Super admin user seed data (from JSON config)
 * Same as User type but with string timestamps for JSON compatibility
 */
export type SuperAdminUserSeed = DateFieldsToString<User>;

/**
 * Test user seed data (from JSON config)
 * Same as User type but with string timestamps for JSON compatibility
 */
export type TestUserSeed = DateFieldsToString<User>;

/**
 * Super admin Cognito seed data
 * (Cognito is not a database entity, so we define this separately)
 */
export interface SuperAdminCognitoSeed {
  email: string;
  cognitoSub: string;
  temporaryPassword: string;
}

/**
 * Test user Cognito seed data
 * (Cognito is not a database entity, so we define this separately)
 */
export interface TestUserCognitoSeed {
  email: string;
  cognitoSub: string;
  temporaryPassword: string;
}

/**
 * Complete seed data configuration
 */
export interface SeedConfig {
  platformTenant: PlatformTenantSeed;
  superAdminUser: SuperAdminUserSeed;
  superAdminCognito: SuperAdminCognitoSeed;
  testCustomerTenant: TestCustomerTenantSeed;
  testCustomer: TestCustomerSeed;
  testCustomerAdminUser: TestUserSeed;
  testCustomerAdminCognito: TestUserCognitoSeed;
  testCustomerProgrammeUser: TestUserSeed;
  testCustomerProgrammeUserCognito: TestUserCognitoSeed;
}
