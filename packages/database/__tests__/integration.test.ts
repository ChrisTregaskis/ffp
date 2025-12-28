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
import { users, tenants, customers } from '../src/schema';
import { withRLS } from '../src/lib/rls';
import { eq, sql } from 'drizzle-orm';
import { randomUUID } from 'crypto';

describe('Drizzle Integration Tests', () => {
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
    await db.execute(sql`TRUNCATE TABLE customers CASCADE`);
    await db.execute(sql`TRUNCATE TABLE assessment_flows CASCADE`);
    await db.execute(sql`TRUNCATE TABLE process_jobs CASCADE`);
    await db.execute(sql`TRUNCATE TABLE tenants CASCADE`);
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
    await db.execute(sql`TRUNCATE TABLE customers CASCADE`);
    await db.execute(sql`TRUNCATE TABLE assessment_flows CASCADE`);
    await db.execute(sql`TRUNCATE TABLE process_jobs CASCADE`);
    await db.execute(sql`TRUNCATE TABLE tenants CASCADE`);
  });

  describe('Basic CRUD Operations', () => {
    it('should create and query tenant successfully', async () => {
      const tenantId = randomUUID();

      // Use withRLS to set context and create tenant
      const tenant = await withRLS(db, tenantId, undefined, async (tx) => {
        const [newTenant] = await tx
          .insert(tenants)
          .values({
            id: tenantId,
            type: 'individual',
            name: 'Test Tenant',
            settings: { theme: 'light' },
          })
          .returning();

        return newTenant;
      });

      expect(tenant).toBeDefined();
      expect(tenant.id).toBe(tenantId);
      expect(tenant.name).toBe('Test Tenant');
      expect(tenant.type).toBe('individual');

      // Query it back
      const queriedTenant = await withRLS(db, tenantId, undefined, async (tx) => {
        const [result] = await tx.select().from(tenants).where(eq(tenants.id, tenantId));

        return result;
      });

      expect(queriedTenant).toBeDefined();
      expect(queriedTenant.name).toBe('Test Tenant');
    });

    it('should create and query customer successfully', async () => {
      const tenantId = randomUUID();

      // Create tenant and customer in transaction
      const { customer } = await withRLS(db, tenantId, undefined, async (tx) => {
        // Create tenant first
        const [newTenant] = await tx
          .insert(tenants)
          .values({
            id: tenantId,
            type: 'business',
            name: 'Business Tenant',
          })
          .returning();

        // Create customer
        const [newCustomer] = await tx
          .insert(customers)
          .values({
            tenantId: tenantId,
            name: 'Test Customer',
            accountCode: 'TEST-001',
            status: 'active',
          })
          .returning();

        return { tenant: newTenant, customer: newCustomer };
      });

      expect(customer).toBeDefined();
      expect(customer.tenantId).toBe(tenantId);
      expect(customer.name).toBe('Test Customer');

      // Query it back
      const queriedCustomer = await withRLS(db, tenantId, undefined, async (tx) => {
        const [result] = await tx.select().from(customers).where(eq(customers.id, customer.id));

        return result;
      });

      expect(queriedCustomer).toBeDefined();
      expect(queriedCustomer.accountCode).toBe('TEST-001');
    });

    it('should create and query user successfully', async () => {
      const tenantId = randomUUID();
      const userId = randomUUID();

      // Create tenant and user
      const { user } = await withRLS(db, tenantId, undefined, async (tx) => {
        // Create tenant
        const [newTenant] = await tx
          .insert(tenants)
          .values({
            id: tenantId,
            type: 'individual',
            name: 'Test Tenant',
          })
          .returning();

        // Create user
        const [newUser] = await tx
          .insert(users)
          .values({
            id: userId,
            tenantId: tenantId,
            email: 'test@example.com',
            cognitoSub: 'cognito-123',
            firstName: 'John',
            lastName: 'Doe',
            role: 'program_user',
          })
          .returning();

        return { tenant: newTenant, user: newUser };
      });

      expect(user).toBeDefined();
      expect(user.id).toBe(userId);
      expect(user.email).toBe('test@example.com');

      // Query it back
      const queriedUser = await withRLS(db, tenantId, undefined, async (tx) => {
        const [result] = await tx.select().from(users).where(eq(users.id, userId));

        return result;
      });

      expect(queriedUser).toBeDefined();
      expect(queriedUser.firstName).toBe('John');
    });

    it('should update tenant successfully', async () => {
      const tenantId = randomUUID();

      // Create tenant
      await withRLS(db, tenantId, undefined, async (tx) => {
        await tx.insert(tenants).values({
          id: tenantId,
          type: 'individual',
          name: 'Original Name',
        });
      });

      // Update tenant
      await withRLS(db, tenantId, undefined, async (tx) => {
        await tx.update(tenants).set({ name: 'Updated Name' }).where(eq(tenants.id, tenantId));
      });

      // Verify update
      const updated = await withRLS(db, tenantId, undefined, async (tx) => {
        const [result] = await tx.select().from(tenants).where(eq(tenants.id, tenantId));

        return result;
      });

      expect(updated.name).toBe('Updated Name');
    });

    it('should delete customer successfully', async () => {
      const tenantId = randomUUID();

      // Create tenant and customer
      const customerId = await withRLS(db, tenantId, undefined, async (tx) => {
        await tx.insert(tenants).values({
          id: tenantId,
          type: 'business',
          name: 'Test Tenant',
        });

        const [customer] = await tx
          .insert(customers)
          .values({
            tenantId: tenantId,
            name: 'Test Customer',
            accountCode: 'DEL-001',
            status: 'active',
          })
          .returning();

        return customer.id;
      });

      // Delete customer
      await withRLS(db, tenantId, undefined, async (tx) => {
        await tx.delete(customers).where(eq(customers.id, customerId));
      });

      // Verify deletion
      const deleted = await withRLS(db, tenantId, undefined, async (tx) => {
        const result = await tx.select().from(customers).where(eq(customers.id, customerId));

        return result;
      });

      expect(deleted.length).toBe(0);
    });
  });

  describe('Connection Pool Behaviour', () => {
    it('should reuse database connections from pool', async () => {
      const tenantId = randomUUID();

      // Create tenant first
      await withRLS(db, tenantId, undefined, async (tx) => {
        await tx.insert(tenants).values({
          id: tenantId,
          type: 'individual',
          name: 'Pool Test',
        });
      });

      // Execute multiple queries in parallel
      const queries = Array(5)
        .fill(null)
        .map(() =>
          withRLS(db, tenantId, undefined, async (tx) => {
            return await tx.select().from(tenants).limit(1);
          })
        );

      const results = await Promise.all(queries);

      // All queries should complete successfully
      expect(results).toHaveLength(5);

      // Connection pool should have reused connections
      // (Implicit test - if connections weren't reused, we'd hit limits or see errors)
    });

    it('should handle concurrent inserts correctly', async () => {
      const tenantId = randomUUID();

      // Create tenant first
      await withRLS(db, tenantId, undefined, async (tx) => {
        await tx.insert(tenants).values({
          id: tenantId,
          type: 'individual',
          name: 'Concurrent Test',
        });
      });

      // Create 5 users concurrently
      const userPromises = Array(5)
        .fill(null)
        .map((_, i) =>
          withRLS(db, tenantId, undefined, async (tx) => {
            const [user] = await tx
              .insert(users)
              .values({
                id: randomUUID(),
                tenantId: tenantId,
                email: `user${i}@test.com`,
                cognitoSub: `cognito-${i}`,
                firstName: `User${i}`,
                lastName: 'Test',
                role: 'program_user',
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
      const invalidTenantId = randomUUID();
      const userId = randomUUID();

      // Try to create user without valid tenant (should fail)
      await expect(async () => {
        // Note: We still need to set RLS context, but the FK will fail
        await withRLS(db, invalidTenantId, undefined, async (tx) => {
          await tx.insert(users).values({
            id: userId,
            tenantId: invalidTenantId, // Non-existent tenant
            email: 'test@example.com',
            cognitoSub: 'cognito-123',
            firstName: 'John',
            lastName: 'Doe',
            role: 'program_user',
          });
        });
      }).rejects.toThrow();
    });

    it('should enforce unique email constraint', async () => {
      const tenantId = randomUUID();

      // Create tenant and first user
      await withRLS(db, tenantId, undefined, async (tx) => {
        await tx.insert(tenants).values({
          id: tenantId,
          type: 'individual',
          name: 'Test Tenant',
        });

        await tx.insert(users).values({
          id: randomUUID(),
          tenantId: tenantId,
          email: 'duplicate@test.com',
          cognitoSub: 'cognito-1',
          firstName: 'User',
          lastName: 'One',
          role: 'program_user',
        });
      });

      // Try to create second user with same email (should fail)
      await expect(async () => {
        await withRLS(db, tenantId, undefined, async (tx) => {
          await tx.insert(users).values({
            id: randomUUID(),
            tenantId: tenantId,
            email: 'duplicate@test.com', // Duplicate
            cognitoSub: 'cognito-2',
            firstName: 'User',
            lastName: 'Two',
            role: 'program_user',
          });
        });
      }).rejects.toThrow();
    });

    it('should enforce unique account code constraint', async () => {
      const tenantId = randomUUID();

      // Create tenant and first customer
      await withRLS(db, tenantId, undefined, async (tx) => {
        await tx.insert(tenants).values({
          id: tenantId,
          type: 'business',
          name: 'Test Tenant',
        });

        await tx.insert(customers).values({
          tenantId: tenantId,
          name: 'Customer One',
          accountCode: 'DUPLICATE',
          status: 'active',
        });
      });

      // Try to create second customer with same account code (should fail)
      await expect(async () => {
        await withRLS(db, tenantId, undefined, async (tx) => {
          await tx.insert(customers).values({
            tenantId: tenantId,
            name: 'Customer Two',
            accountCode: 'DUPLICATE', // Duplicate
            status: 'active',
          });
        });
      }).rejects.toThrow();
    });

    it('should cascade delete when tenant is deleted', async () => {
      const tenantId = randomUUID();
      const userId = randomUUID();

      // Create tenant and user
      await withRLS(db, tenantId, undefined, async (tx) => {
        await tx.insert(tenants).values({
          id: tenantId,
          type: 'individual',
          name: 'Test Tenant',
        });

        await tx.insert(users).values({
          id: userId,
          tenantId: tenantId,
          email: 'cascade@test.com',
          cognitoSub: 'cognito-cascade',
          firstName: 'Cascade',
          lastName: 'Test',
          role: 'program_user',
        });
      });

      // Delete tenant (should cascade to user)
      await withRLS(db, tenantId, undefined, async (tx) => {
        await tx.delete(tenants).where(eq(tenants.id, tenantId));
      });

      // Verify user was also deleted
      // Note: After tenant deletion, we can't use RLS context, so use raw query
      const [userCheck] = await db.select().from(users).where(eq(users.id, userId));

      expect(userCheck).toBeUndefined();
    });
  });

  describe('Transactions', () => {
    it('should handle transactions correctly', async () => {
      const tenantId = randomUUID();

      // Transaction using withRLS (which uses db.transaction internally)
      await withRLS(db, tenantId, undefined, async (tx) => {
        // Create tenant
        await tx.insert(tenants).values({
          id: tenantId,
          type: 'business',
          name: 'Transaction Test',
        });

        // Create customer
        const [customer] = await tx
          .insert(customers)
          .values({
            tenantId: tenantId,
            name: 'Test Customer',
            accountCode: 'TXN-001',
            status: 'active',
          })
          .returning();

        // Create user
        await tx.insert(users).values({
          id: randomUUID(),
          tenantId: tenantId,
          customerId: customer.id,
          email: 'txn@test.com',
          cognitoSub: 'cognito-txn',
          firstName: 'Transaction',
          lastName: 'User',
          role: 'program_user',
        });
      });

      // Verify all data was inserted
      const allUsers = await withRLS(db, tenantId, undefined, async (tx) => {
        return await tx.select().from(users);
      });

      expect(allUsers.length).toBeGreaterThan(0);
    });

    it('should rollback transaction on error', async () => {
      const tenantId = randomUUID();

      await expect(async () => {
        await withRLS(db, tenantId, undefined, async (tx) => {
          // Create tenant
          await tx.insert(tenants).values({
            id: tenantId,
            type: 'individual',
            name: 'Rollback Test',
          });

          // Force an error (duplicate email won't work without existing user, so use invalid FK)
          await tx.insert(users).values({
            id: randomUUID(),
            tenantId: randomUUID(), // Invalid FK - different tenant
            email: 'rollback@test.com',
            cognitoSub: 'cognito-fail',
            firstName: 'Fail',
            lastName: 'User',
            role: 'program_user',
          });
        });
      }).rejects.toThrow();

      // Verify tenant was NOT created (transaction rolled back)
      // Use raw query since tenant doesn't exist
      const [tenantCheck] = await db.select().from(tenants).where(eq(tenants.id, tenantId));

      expect(tenantCheck).toBeUndefined();
    });

    it('should support nested operations in transaction', async () => {
      const tenantId = randomUUID();

      const result = await withRLS(db, tenantId, undefined, async (tx) => {
        // Create tenant
        const [tenant] = await tx
          .insert(tenants)
          .values({
            id: tenantId,
            type: 'business',
            name: 'Nested Test',
          })
          .returning();

        // Create multiple customers
        const [customer1] = await tx
          .insert(customers)
          .values({
            tenantId: tenantId,
            name: 'Customer 1',
            accountCode: 'NESTED-001',
            status: 'active',
          })
          .returning();

        const [customer2] = await tx
          .insert(customers)
          .values({
            tenantId: tenantId,
            name: 'Customer 2',
            accountCode: 'NESTED-002',
            status: 'active',
          })
          .returning();

        // Create users for each customer
        const [user1] = await tx
          .insert(users)
          .values({
            id: randomUUID(),
            tenantId: tenantId,
            customerId: customer1.id,
            email: 'user1@nested.com',
            cognitoSub: 'cognito-nested-1',
            firstName: 'User',
            lastName: 'One',
            role: 'program_user',
          })
          .returning();

        const [user2] = await tx
          .insert(users)
          .values({
            id: randomUUID(),
            tenantId: tenantId,
            customerId: customer2.id,
            email: 'user2@nested.com',
            cognitoSub: 'cognito-nested-2',
            firstName: 'User',
            lastName: 'Two',
            role: 'program_user',
          })
          .returning();

        return { tenant, customers: [customer1, customer2], users: [user1, user2] };
      });

      expect(result.tenant).toBeDefined();
      expect(result.customers).toHaveLength(2);
      expect(result.users).toHaveLength(2);
    });
  });

  describe('Row-Level Security', () => {
    it('should isolate data between tenants', async () => {
      const tenant1Id = randomUUID();
      const tenant2Id = randomUUID();

      // Create two separate tenants with users
      // Use withRLS to properly enforce RLS policies during setup
      await withRLS(db, tenant1Id, undefined, async (tx) => {
        await tx.insert(tenants).values({
          id: tenant1Id,
          type: 'individual',
          name: 'Tenant 1',
        });

        await tx.insert(users).values({
          id: randomUUID(),
          tenantId: tenant1Id,
          email: 'tenant1@test.com',
          cognitoSub: 'cognito-tenant1',
          firstName: 'Tenant',
          lastName: 'One',
          role: 'program_user',
        });
      });

      await withRLS(db, tenant2Id, undefined, async (tx) => {
        await tx.insert(tenants).values({
          id: tenant2Id,
          type: 'individual',
          name: 'Tenant 2',
        });

        await tx.insert(users).values({
          id: randomUUID(),
          tenantId: tenant2Id,
          email: 'tenant2@test.com',
          cognitoSub: 'cognito-tenant2',
          firstName: 'Tenant',
          lastName: 'Two',
          role: 'program_user',
        });
      });

      // Query as tenant 1 - should only see tenant 1's users
      const tenant1Users = await withRLS(db, tenant1Id, undefined, async (tx) => {
        return await tx.select().from(users);
      });

      expect(tenant1Users).toHaveLength(1);
      expect(tenant1Users[0].email).toBe('tenant1@test.com');

      // Query as tenant 2 - should only see tenant 2's users
      const tenant2Users = await withRLS(db, tenant2Id, undefined, async (tx) => {
        return await tx.select().from(users);
      });

      expect(tenant2Users).toHaveLength(1);
      expect(tenant2Users[0].email).toBe('tenant2@test.com');
    });
  });
});
