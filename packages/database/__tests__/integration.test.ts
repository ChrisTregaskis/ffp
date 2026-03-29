/**
 * Drizzle ORM Integration Tests
 *
 * Tests actual database operations against a real PostgreSQL instance.
 * Requires a test database to be set up and migrated.
 *
 * Setup:
 * 1. Create test database: psql -h localhost -d postgres -c "CREATE DATABASE ffp_test;"
 * 2. Run migrations: DB_NAME=ffp_test pnpm db:migrate
 * 3. Run tests: pnpm test
 *
 * IMPORTANT: Tests connect as `test_user` which does NOT have BYPASSRLS,
 * so RLS policies are enforced automatically.
 *
 * @module __tests__/integration.test
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { getDb, closeDb } from '../src/client';
import { users, organisations, locations } from '../src/schema';
import { withRLS } from '../src/lib/rls';
import { canConnectToDatabase } from '../src/lib/test-utils';
import { eq, sql } from 'drizzle-orm';
import { randomUUID } from 'crypto';

const dbAvailable = await canConnectToDatabase();

describe.runIf(dbAvailable)('Drizzle Integration Tests', () => {
  let db: ReturnType<typeof getDb>;

  beforeAll(async () => {
    // Setup test database connection
    // IMPORTANT: test_user does NOT have BYPASSRLS, so RLS policies are enforced
    process.env.DB_HOST = 'localhost';
    process.env.DB_PORT = '5432';
    process.env.DB_NAME = 'ffp_test';
    process.env.DB_USER = 'test_user';
    process.env.DB_PASSWORD = 'test_password';
    process.env.DB_SSL = 'false';

    db = getDb();

    // Clean slate: Truncate all tables before running test suite
    // This ensures no leftover data from manual testing or seed scripts interferes
    await db.execute(sql`TRUNCATE TABLE user_assessments CASCADE`);
    await db.execute(sql`TRUNCATE TABLE users CASCADE`);
    await db.execute(sql`TRUNCATE TABLE locations CASCADE`);
    await db.execute(sql`TRUNCATE TABLE assessment_flows CASCADE`);
    await db.execute(sql`TRUNCATE TABLE process_jobs CASCADE`);
    await db.execute(sql`TRUNCATE TABLE organisations CASCADE`);
  });

  afterAll(async () => {
    // Cleanup: Close connection pool
    await closeDb();
  });

  beforeEach(async () => {
    // Clean tables before each test
    // Note: RLS will prevent deletion without context, so we use raw SQL
    // Order respects FK constraints (CASCADE handles dependencies)
    await db.execute(sql`TRUNCATE TABLE user_assessments CASCADE`);
    await db.execute(sql`TRUNCATE TABLE users CASCADE`);
    await db.execute(sql`TRUNCATE TABLE locations CASCADE`);
    await db.execute(sql`TRUNCATE TABLE assessment_flows CASCADE`);
    await db.execute(sql`TRUNCATE TABLE process_jobs CASCADE`);
    await db.execute(sql`TRUNCATE TABLE organisations CASCADE`);
  });

  describe('Basic CRUD Operations', () => {
    it('should create and query organisation successfully', async () => {
      const orgId = randomUUID();

      // Use withRLS to set context and create organisation
      const org = await withRLS(db, orgId, undefined, async (tx) => {
        const [newOrg] = await tx
          .insert(organisations)
          .values({
            id: orgId,
            type: 'individual',
            name: 'Test Organisation',
            settings: { theme: 'light' },
          })
          .returning();

        return newOrg;
      });

      expect(org).toBeDefined();
      expect(org.id).toBe(orgId);
      expect(org.name).toBe('Test Organisation');
      expect(org.type).toBe('individual');

      // Query it back
      const queriedOrg = await withRLS(db, orgId, undefined, async (tx) => {
        const [result] = await tx.select().from(organisations).where(eq(organisations.id, orgId));

        return result;
      });

      expect(queriedOrg).toBeDefined();
      expect(queriedOrg.name).toBe('Test Organisation');
    });

    it('should create and query location successfully', async () => {
      const orgId = randomUUID();

      // Create organisation and location in transaction
      const { location } = await withRLS(db, orgId, undefined, async (tx) => {
        // Create organisation first
        const [newOrg] = await tx
          .insert(organisations)
          .values({
            id: orgId,
            type: 'business',
            name: 'Business Organisation',
          })
          .returning();

        // Create location
        const [newLocation] = await tx
          .insert(locations)
          .values({
            organisationId: orgId,
            name: 'Test Location',
            accountCode: 'TEST-001',
            status: 'active',
          })
          .returning();

        return { organisation: newOrg, location: newLocation };
      });

      expect(location).toBeDefined();
      expect(location.organisationId).toBe(orgId);
      expect(location.name).toBe('Test Location');

      // Query it back
      const queriedLocation = await withRLS(db, orgId, undefined, async (tx) => {
        const [result] = await tx.select().from(locations).where(eq(locations.id, location.id));

        return result;
      });

      expect(queriedLocation).toBeDefined();
      expect(queriedLocation.accountCode).toBe('TEST-001');
    });

    it('should create and query user successfully', async () => {
      const orgId = randomUUID();
      const userId = randomUUID();

      // Create organisation and user
      const { user } = await withRLS(db, orgId, undefined, async (tx) => {
        // Create organisation
        const [newOrg] = await tx
          .insert(organisations)
          .values({
            id: orgId,
            type: 'individual',
            name: 'Test Organisation',
          })
          .returning();

        // Create user
        const [newUser] = await tx
          .insert(users)
          .values({
            id: userId,
            organisationId: orgId,
            email: 'test@example.com',
            cognitoSub: 'cognito-123',
            firstName: 'John',
            lastName: 'Doe',
            role: 'programme_user',
          })
          .returning();

        return { organisation: newOrg, user: newUser };
      });

      expect(user).toBeDefined();
      expect(user.id).toBe(userId);
      expect(user.email).toBe('test@example.com');

      // Query it back
      const queriedUser = await withRLS(db, orgId, undefined, async (tx) => {
        const [result] = await tx.select().from(users).where(eq(users.id, userId));

        return result;
      });

      expect(queriedUser).toBeDefined();
      expect(queriedUser.firstName).toBe('John');
    });

    it('should update organisation successfully', async () => {
      const orgId = randomUUID();

      // Create organisation
      await withRLS(db, orgId, undefined, async (tx) => {
        await tx.insert(organisations).values({
          id: orgId,
          type: 'individual',
          name: 'Original Name',
        });
      });

      // Update organisation
      await withRLS(db, orgId, undefined, async (tx) => {
        await tx
          .update(organisations)
          .set({ name: 'Updated Name' })
          .where(eq(organisations.id, orgId));
      });

      // Verify update
      const updated = await withRLS(db, orgId, undefined, async (tx) => {
        const [result] = await tx.select().from(organisations).where(eq(organisations.id, orgId));

        return result;
      });

      expect(updated.name).toBe('Updated Name');
    });

    it('should delete location successfully', async () => {
      const orgId = randomUUID();

      // Create organisation and location
      const locationId = await withRLS(db, orgId, undefined, async (tx) => {
        await tx.insert(organisations).values({
          id: orgId,
          type: 'business',
          name: 'Test Organisation',
        });

        const [location] = await tx
          .insert(locations)
          .values({
            organisationId: orgId,
            name: 'Test Location',
            accountCode: 'DEL-001',
            status: 'active',
          })
          .returning();

        return location.id;
      });

      // Delete location
      await withRLS(db, orgId, undefined, async (tx) => {
        await tx.delete(locations).where(eq(locations.id, locationId));
      });

      // Verify deletion
      const deleted = await withRLS(db, orgId, undefined, async (tx) => {
        const result = await tx.select().from(locations).where(eq(locations.id, locationId));

        return result;
      });

      expect(deleted.length).toBe(0);
    });
  });

  describe('Connection Pool Behaviour', () => {
    it('should reuse database connections from pool', async () => {
      const orgId = randomUUID();

      // Create organisation first
      await withRLS(db, orgId, undefined, async (tx) => {
        await tx.insert(organisations).values({
          id: orgId,
          type: 'individual',
          name: 'Pool Test',
        });
      });

      // Execute multiple queries in parallel
      const queries = Array(5)
        .fill(null)
        .map(() =>
          withRLS(db, orgId, undefined, async (tx) => {
            return await tx.select().from(organisations).limit(1);
          })
        );

      const results = await Promise.all(queries);

      // All queries should complete successfully
      expect(results).toHaveLength(5);

      // Connection pool should have reused connections
      // (Implicit test - if connections weren't reused, we'd hit limits or see errors)
    });

    it('should handle concurrent inserts correctly', async () => {
      const orgId = randomUUID();

      // Create organisation first
      await withRLS(db, orgId, undefined, async (tx) => {
        await tx.insert(organisations).values({
          id: orgId,
          type: 'individual',
          name: 'Concurrent Test',
        });
      });

      // Create 5 users concurrently
      const userPromises = Array(5)
        .fill(null)
        .map((_, i) =>
          withRLS(db, orgId, undefined, async (tx) => {
            const [user] = await tx
              .insert(users)
              .values({
                id: randomUUID(),
                organisationId: orgId,
                email: `user${i}@test.com`,
                cognitoSub: `cognito-${i}`,
                firstName: `User${i}`,
                lastName: 'Test',
                role: 'programme_user',
              })
              .returning();

            return user;
          })
        );

      const results = await Promise.all(userPromises);

      expect(results).toHaveLength(5);
      results.forEach((result, i) => {
        expect(result.email).toBe(`user${i}@test.com`);
      });
    });
  });

  describe('Database Constraints', () => {
    it('should enforce foreign key constraints', async () => {
      const invalidOrgId = randomUUID();
      const userId = randomUUID();

      // Try to create user without valid organisation (should fail)
      await expect(async () => {
        // Note: We still need to set RLS context, but the FK will fail
        await withRLS(db, invalidOrgId, undefined, async (tx) => {
          await tx.insert(users).values({
            id: userId,
            organisationId: invalidOrgId, // Non-existent organisation
            email: 'test@example.com',
            cognitoSub: 'cognito-123',
            firstName: 'John',
            lastName: 'Doe',
            role: 'programme_user',
          });
        });
      }).rejects.toThrow();
    });

    it('should enforce unique email constraint', async () => {
      const orgId = randomUUID();

      // Create organisation and first user
      await withRLS(db, orgId, undefined, async (tx) => {
        await tx.insert(organisations).values({
          id: orgId,
          type: 'individual',
          name: 'Test Organisation',
        });

        await tx.insert(users).values({
          id: randomUUID(),
          organisationId: orgId,
          email: 'duplicate@test.com',
          cognitoSub: 'cognito-1',
          firstName: 'User',
          lastName: 'One',
          role: 'programme_user',
        });
      });

      // Try to create second user with same email (should fail)
      await expect(async () => {
        await withRLS(db, orgId, undefined, async (tx) => {
          await tx.insert(users).values({
            id: randomUUID(),
            organisationId: orgId,
            email: 'duplicate@test.com', // Duplicate
            cognitoSub: 'cognito-2',
            firstName: 'User',
            lastName: 'Two',
            role: 'programme_user',
          });
        });
      }).rejects.toThrow();
    });

    it('should enforce unique account code constraint', async () => {
      const orgId = randomUUID();

      // Create organisation and first location
      await withRLS(db, orgId, undefined, async (tx) => {
        await tx.insert(organisations).values({
          id: orgId,
          type: 'business',
          name: 'Test Organisation',
        });

        await tx.insert(locations).values({
          organisationId: orgId,
          name: 'Location One',
          accountCode: 'DUPLICATE',
          status: 'active',
        });
      });

      // Try to create second location with same account code (should fail)
      await expect(async () => {
        await withRLS(db, orgId, undefined, async (tx) => {
          await tx.insert(locations).values({
            organisationId: orgId,
            name: 'Location Two',
            accountCode: 'DUPLICATE', // Duplicate
            status: 'active',
          });
        });
      }).rejects.toThrow();
    });

    it('should cascade delete when organisation is deleted', async () => {
      const orgId = randomUUID();
      const userId = randomUUID();

      // Create organisation and user
      await withRLS(db, orgId, undefined, async (tx) => {
        await tx.insert(organisations).values({
          id: orgId,
          type: 'individual',
          name: 'Test Organisation',
        });

        await tx.insert(users).values({
          id: userId,
          organisationId: orgId,
          email: 'cascade@test.com',
          cognitoSub: 'cognito-cascade',
          firstName: 'Cascade',
          lastName: 'Test',
          role: 'programme_user',
        });
      });

      // Delete organisation (should cascade to user)
      await withRLS(db, orgId, undefined, async (tx) => {
        await tx.delete(organisations).where(eq(organisations.id, orgId));
      });

      // Verify user was also deleted via cascade
      // Set RLS context to the deleted org's ID so the UUID cast succeeds;
      // since the data was cascade-deleted, we expect no rows returned.
      const userCheckResult = await withRLS(db, orgId, undefined, async (tx) => {
        return await tx.select().from(users).where(eq(users.id, userId));
      });

      expect(userCheckResult).toHaveLength(0);
    });
  });

  describe('Transactions', () => {
    it('should handle transactions correctly', async () => {
      const orgId = randomUUID();

      // Transaction using withRLS (which uses db.transaction internally)
      await withRLS(db, orgId, undefined, async (tx) => {
        // Create organisation
        await tx.insert(organisations).values({
          id: orgId,
          type: 'business',
          name: 'Transaction Test',
        });

        // Create location
        const [location] = await tx
          .insert(locations)
          .values({
            organisationId: orgId,
            name: 'Test Location',
            accountCode: 'TXN-001',
            status: 'active',
          })
          .returning();

        // Create user
        await tx.insert(users).values({
          id: randomUUID(),
          organisationId: orgId,
          locationId: location.id,
          email: 'txn@test.com',
          cognitoSub: 'cognito-txn',
          firstName: 'Transaction',
          lastName: 'User',
          role: 'programme_user',
        });
      });

      // Verify all data was inserted
      const allUsers = await withRLS(db, orgId, undefined, async (tx) => {
        return await tx.select().from(users);
      });

      expect(allUsers.length).toBeGreaterThan(0);
    });

    it('should rollback transaction on error', async () => {
      const orgId = randomUUID();

      await expect(async () => {
        await withRLS(db, orgId, undefined, async (tx) => {
          // Create organisation
          await tx.insert(organisations).values({
            id: orgId,
            type: 'individual',
            name: 'Rollback Test',
          });

          // Force an error (invalid FK - different organisation)
          await tx.insert(users).values({
            id: randomUUID(),
            organisationId: randomUUID(), // Invalid FK - different organisation
            email: 'rollback@test.com',
            cognitoSub: 'cognito-fail',
            firstName: 'Fail',
            lastName: 'User',
            role: 'programme_user',
          });
        });
      }).rejects.toThrow();

      // Verify organisation was NOT created (transaction rolled back)
      // Set RLS context to the rolled-back org's ID so the UUID cast succeeds;
      // since the transaction was rolled back, we expect no rows returned.
      const orgCheckResult = await withRLS(db, orgId, undefined, async (tx) => {
        return await tx.select().from(organisations).where(eq(organisations.id, orgId));
      });

      expect(orgCheckResult).toHaveLength(0);
    });

    it('should support nested operations in transaction', async () => {
      const orgId = randomUUID();

      const result = await withRLS(db, orgId, undefined, async (tx) => {
        // Create organisation
        const [org] = await tx
          .insert(organisations)
          .values({
            id: orgId,
            type: 'business',
            name: 'Nested Test',
          })
          .returning();

        // Create multiple locations
        const [location1] = await tx
          .insert(locations)
          .values({
            organisationId: orgId,
            name: 'Location 1',
            accountCode: 'NESTED-001',
            status: 'active',
          })
          .returning();

        const [location2] = await tx
          .insert(locations)
          .values({
            organisationId: orgId,
            name: 'Location 2',
            accountCode: 'NESTED-002',
            status: 'active',
          })
          .returning();

        // Create users for each location
        const [user1] = await tx
          .insert(users)
          .values({
            id: randomUUID(),
            organisationId: orgId,
            locationId: location1.id,
            email: 'user1@nested.com',
            cognitoSub: 'cognito-nested-1',
            firstName: 'User',
            lastName: 'One',
            role: 'programme_user',
          })
          .returning();

        const [user2] = await tx
          .insert(users)
          .values({
            id: randomUUID(),
            organisationId: orgId,
            locationId: location2.id,
            email: 'user2@nested.com',
            cognitoSub: 'cognito-nested-2',
            firstName: 'User',
            lastName: 'Two',
            role: 'programme_user',
          })
          .returning();

        return { organisation: org, locations: [location1, location2], users: [user1, user2] };
      });

      expect(result.organisation).toBeDefined();
      expect(result.locations).toHaveLength(2);
      expect(result.users).toHaveLength(2);
    });
  });

  describe('Row-Level Security', () => {
    it('should isolate data between organisations', async () => {
      const org1Id = randomUUID();
      const org2Id = randomUUID();

      // Create two separate organisations with users
      await withRLS(db, org1Id, undefined, async (tx) => {
        await tx.insert(organisations).values({
          id: org1Id,
          type: 'individual',
          name: 'Organisation 1',
        });

        await tx.insert(users).values({
          id: randomUUID(),
          organisationId: org1Id,
          email: 'org1@test.com',
          cognitoSub: 'cognito-org1',
          firstName: 'Org',
          lastName: 'One',
          role: 'programme_user',
        });
      });

      await withRLS(db, org2Id, undefined, async (tx) => {
        await tx.insert(organisations).values({
          id: org2Id,
          type: 'individual',
          name: 'Organisation 2',
        });

        await tx.insert(users).values({
          id: randomUUID(),
          organisationId: org2Id,
          email: 'org2@test.com',
          cognitoSub: 'cognito-org2',
          firstName: 'Org',
          lastName: 'Two',
          role: 'programme_user',
        });
      });

      // Query as organisation 1 - should only see organisation 1's users
      const org1Users = await withRLS(db, org1Id, undefined, async (tx) => {
        return await tx.select().from(users);
      });

      expect(org1Users).toHaveLength(1);
      expect(org1Users[0].email).toBe('org1@test.com');

      // Query as organisation 2 - should only see organisation 2's users
      const org2Users = await withRLS(db, org2Id, undefined, async (tx) => {
        return await tx.select().from(users);
      });

      expect(org2Users).toHaveLength(1);
      expect(org2Users[0].email).toBe('org2@test.com');
    });
  });
});
