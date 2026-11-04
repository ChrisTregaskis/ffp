import type { Organisation, Location, User } from '../src/schema/index.js';

/**
 * Utility type to convert Date fields to string (for JSON serialisation)
 * JSON cannot represent Date objects, so we store timestamps as ISO strings
 */
type DateFieldsToString<T> = {
  [K in keyof T]: T[K] extends Date ? string : T[K];
};

/**
 * Test location organisation seed data (from JSON config)
 * Same as Organisation type but with string timestamps for JSON compatibility
 */
export type TestLocationOrganisationSeed = DateFieldsToString<Organisation>;

/**
 * Test location seed data (from JSON config)
 * Same as Location type but with string timestamps for JSON compatibility
 */
export type TestLocationSeed = DateFieldsToString<Location>;

/**
 * Test user seed data (from JSON config)
 * Same as User type but with string timestamps for JSON compatibility
 */
export type TestUserSeed = DateFieldsToString<User>;

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
 * The demo seed's configuration. The platform organisation is reference data, defined in code.
 */
export interface SeedConfig {
  testLocationOrganisation: TestLocationOrganisationSeed;
  testLocation: TestLocationSeed;
  testLocationAdminUser: TestUserSeed;
  testLocationAdminCognito: TestUserCognitoSeed;
  testLocationProgrammeUser: TestUserSeed;
  testLocationProgrammeUserCognito: TestUserCognitoSeed;
}
