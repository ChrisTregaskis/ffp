/**
 * RLS Integration Tests
 *
 * Tests Row-Level Security policies and utility functions to ensure
 * multi-tenant data isolation works correctly at the database level.
 *
 * These tests use a real PostgreSQL database connection to verify:
 * - RLS context setting works correctly
 * - Cross-tenant isolation prevents data leaks
 * - All three tables (tenants, customers, users) enforce RLS
 * - Queries fail/return empty without RLS context
 *
 * IMPORTANT: Tests connect as `test_user` which does NOT have BYPASSRLS,
 * so RLS policies are enforced automatically.
 *
 * @module lib/rls.test
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { eq, sql } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { setRLSContext, withRLS } from './rls';
import { users, tenants, customers } from '../schema';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';

describe('RLS Utility Functions', () => {
  let db: NodePgDatabase<any>;
  let pool: Pool;

  // Test data IDs
  let tenantAId: string;
  let tenantBId: string;
  let customerAId: string;
  let customerBId: string;
  let userA1Id: string;
  let userA2Id: string;
  let userB1Id: string;

  beforeAll(async () => {
    // Setup test database connection
    // IMPORTANT: test_user does NOT have BYPASSRLS, so RLS policies are enforced
    pool = new Pool({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      database: 'ffp_test',
      user: process.env.DB_USER || 'test_user',
      password: process.env.DB_PASSWORD || 'test_password',
    });
    db = drizzle(pool);

    // Clean slate: Truncate all tables before running tests
    // This ensures no leftover data from manual testing or seed scripts interferes
    // Order respects FK constraints (CASCADE handles dependencies)
    await db.execute(sql`TRUNCATE TABLE user_assessments CASCADE`);
    await db.execute(sql`TRUNCATE TABLE users CASCADE`);
    await db.execute(sql`TRUNCATE TABLE customers CASCADE`);
    await db.execute(sql`TRUNCATE TABLE assessment_flows CASCADE`);
    await db.execute(sql`TRUNCATE TABLE process_jobs CASCADE`);
    await db.execute(sql`TRUNCATE TABLE tenants CASCADE`);
  });

  beforeEach(async () => {
    // Create test data for two tenants before EACH test
    // This ensures data exists even if other test suites clean the database
    // Note: We need to set RLS context with the tenant ID we're creating
    // First, create tenant records with generated UUIDs
    tenantAId = randomUUID();
    tenantBId = randomUUID();

    // Set context for Tenant A and create it
    await db.execute(sql.raw(`SET app.tenant_id = '${tenantAId}'`));
    await db
      .insert(tenants)
      .values({
        id: tenantAId,
        type: 'business',
        name: 'Test Tenant A',
        settings: {},
      })
      .returning();

    // Set context for Tenant B and create it
    await db.execute(sql.raw(`SET app.tenant_id = '${tenantBId}'`));
    await db
      .insert(tenants)
      .values({
        id: tenantBId,
        type: 'individual',
        name: 'Test Tenant B',
        settings: {},
      })
      .returning();

    // Customer A (belongs to Tenant A)
    await db.execute(sql.raw(`SET app.tenant_id = '${tenantAId}'`));
    const [customerA] = await db
      .insert(customers)
      .values({
        tenantId: tenantAId,
        name: 'Customer A',
        accountCode: 'CUST-A-TEST',
        status: 'active',
      })
      .returning();
    customerAId = customerA.id;

    // Customer B (belongs to Tenant B - even though individual type)
    await db.execute(sql.raw(`SET app.tenant_id = '${tenantBId}'`));
    const [customerB] = await db
      .insert(customers)
      .values({
        tenantId: tenantBId,
        name: 'Customer B',
        accountCode: 'CUST-B-TEST',
        status: 'active',
      })
      .returning();
    customerBId = customerB.id;

    // Users for Tenant A
    await db.execute(sql.raw(`SET app.tenant_id = '${tenantAId}'`));
    userA1Id = randomUUID();
    await db
      .insert(users)
      .values({
        id: userA1Id,
        tenantId: tenantAId,
        customerId: customerAId,
        email: 'user-a1@test.com',
        cognitoSub: 'cognito-sub-a1',
        firstName: 'Alice',
        lastName: 'Anderson',
        role: 'programme_user',
      })
      .returning();

    userA2Id = randomUUID();
    await db
      .insert(users)
      .values({
        id: userA2Id,
        tenantId: tenantAId,
        customerId: customerAId,
        email: 'user-a2@test.com',
        cognitoSub: 'cognito-sub-a2',
        firstName: 'Adam',
        lastName: 'Anderson',
        role: 'customer_admin',
      })
      .returning();

    // User for Tenant B
    await db.execute(sql.raw(`SET app.tenant_id = '${tenantBId}'`));
    userB1Id = randomUUID();
    await db
      .insert(users)
      .values({
        id: userB1Id,
        tenantId: tenantBId,
        customerId: null, // Individual user (no customer)
        email: 'user-b1@test.com',
        cognitoSub: 'cognito-sub-b1',
        firstName: 'Bob',
        lastName: 'Brown',
        role: 'programme_user',
      })
      .returning();
  });

  afterEach(async () => {
    // Clean up test data after each test
    // This matches the integration test pattern and ensures test isolation
    // Order respects FK constraints (CASCADE handles dependencies)
    await db.execute(sql`TRUNCATE TABLE user_assessments CASCADE`);
    await db.execute(sql`TRUNCATE TABLE users CASCADE`);
    await db.execute(sql`TRUNCATE TABLE customers CASCADE`);
    await db.execute(sql`TRUNCATE TABLE assessment_flows CASCADE`);
    await db.execute(sql`TRUNCATE TABLE process_jobs CASCADE`);
    await db.execute(sql`TRUNCATE TABLE tenants CASCADE`);
  });

  afterAll(async () => {
    // Close connection pool
    await pool.end();
  });

  describe('setRLSContext', () => {
    it('should set RLS context with tenant ID only', async () => {
      await db.transaction(async (tx) => {
        await setRLSContext(tx, tenantAId);

        // Verify context is set by querying and checking we only get tenant A data
        const result = await tx.select().from(users);
        expect(result.length).toBe(2); // Only tenant A users
        expect(result.every((u) => u.tenantId === tenantAId)).toBe(true);
      });
    });

    it('should set RLS context with both tenant ID and user ID', async () => {
      await db.transaction(async (tx) => {
        await setRLSContext(tx, tenantAId, userA1Id);

        // Verify context is set by querying
        const result = await tx.select().from(users);
        expect(result.length).toBe(2); // Both tenant A users visible
        expect(result.every((u) => u.tenantId === tenantAId)).toBe(true);
      });
    });

    it('should throw error if tenantId is not provided', async () => {
      await expect(
        db.transaction(async (tx) => {
          await setRLSContext(tx, '');
        })
      ).rejects.toThrow('tenantId is required for RLS context');
    });
  });

  describe('withRLS', () => {
    it('should execute callback within RLS context', async () => {
      const result = await withRLS(db, tenantAId, undefined, async (tx) => {
        return await tx.select().from(users);
      });

      expect(result.length).toBe(2); // Only tenant A users
      expect(result.every((u) => u.tenantId === tenantAId)).toBe(true);
    });

    it('should execute callback with user context', async () => {
      const result = await withRLS(db, tenantBId, userB1Id, async (tx) => {
        return await tx.select().from(users);
      });

      expect(result.length).toBe(1); // Only tenant B user
      expect(result[0].tenantId).toBe(tenantBId);
    });

    it('should throw error if tenantId is not provided', async () => {
      await expect(
        withRLS(db, '', undefined, async (tx) => {
          return await tx.select().from(users);
        })
      ).rejects.toThrow('tenantId is required for RLS context');
    });
  });

  describe('Cross-Tenant Isolation - Tenants Table', () => {
    it('should only return current tenant when RLS context is set', async () => {
      const result = await withRLS(db, tenantAId, undefined, async (tx) => {
        return await tx.select().from(tenants);
      });

      expect(result.length).toBe(1);
      expect(result[0].id).toBe(tenantAId);
      expect(result[0].name).toBe('Test Tenant A');
    });

    it('should not return other tenant data', async () => {
      const result = await withRLS(db, tenantAId, undefined, async (tx) => {
        return await tx.select().from(tenants).where(eq(tenants.id, tenantBId));
      });

      expect(result.length).toBe(0); // Tenant B should not be visible
    });
  });

  describe('Cross-Tenant Isolation - Customers Table', () => {
    it('should only return customers for current tenant', async () => {
      const result = await withRLS(db, tenantAId, undefined, async (tx) => {
        return await tx.select().from(customers);
      });

      expect(result.length).toBe(1);
      expect(result[0].id).toBe(customerAId);
      expect(result[0].tenantId).toBe(tenantAId);
    });

    it('should not return customers from other tenants', async () => {
      const result = await withRLS(db, tenantAId, undefined, async (tx) => {
        return await tx.select().from(customers).where(eq(customers.id, customerBId));
      });

      expect(result.length).toBe(0); // Customer B should not be visible
    });

    it('should return correct customers for tenant B', async () => {
      const result = await withRLS(db, tenantBId, undefined, async (tx) => {
        return await tx.select().from(customers);
      });

      expect(result.length).toBe(1);
      expect(result[0].id).toBe(customerBId);
      expect(result[0].tenantId).toBe(tenantBId);
    });
  });

  describe('Cross-Tenant Isolation - Users Table', () => {
    it('should only return users for current tenant', async () => {
      const result = await withRLS(db, tenantAId, undefined, async (tx) => {
        return await tx.select().from(users);
      });

      expect(result.length).toBe(2); // Two users in tenant A
      expect(result.every((u) => u.tenantId === tenantAId)).toBe(true);
    });

    it('should not return users from other tenants', async () => {
      const result = await withRLS(db, tenantAId, undefined, async (tx) => {
        return await tx.select().from(users).where(eq(users.id, userB1Id));
      });

      expect(result.length).toBe(0); // User B1 should not be visible
    });

    it('should return correct users for tenant B', async () => {
      const result = await withRLS(db, tenantBId, undefined, async (tx) => {
        return await tx.select().from(users);
      });

      expect(result.length).toBe(1); // One user in tenant B
      expect(result[0].id).toBe(userB1Id);
      expect(result[0].tenantId).toBe(tenantBId);
    });
  });

  describe('Queries Without RLS Context', () => {
    it('should return empty results when querying without RLS context', async () => {
      // test_user does NOT have BYPASSRLS, so RLS policies are enforced
      // Set app.tenant_id to a valid UUID that doesn't exist in the data
      // (beforeEach sets it to actual tenant IDs during data creation)
      // Note: We use a zeros UUID which is valid but won't match any tenant
      const nonExistentTenantId = '00000000-0000-0000-8000-000000000000';
      await db.execute(sql.raw(`SET app.tenant_id = '${nonExistentTenantId}'`));

      // Without a matching tenant_id, queries should return empty results
      const result = await db.select().from(users);
      expect(result.length).toBe(0); // No results for non-existent tenant
    });

    it('should verify RLS is enabled on all tables', async () => {
      const rlsCheck = await db.execute(sql`
        SELECT tablename, rowsecurity
        FROM pg_tables
        WHERE schemaname = 'public'
          AND tablename IN ('tenants', 'customers', 'users')
      `);

      // Verify RLS is enabled (rowsecurity = true)
      const tables = rlsCheck.rows;
      expect(tables.length).toBe(3);
      tables.forEach((table: any) => {
        expect(table.rowsecurity).toBe(true);
      });
    });

    it('should verify RLS policies exist on all tables', async () => {
      const policiesCheck = await db.execute(sql`
        SELECT tablename, policyname
        FROM pg_policies
        WHERE schemaname = 'public'
        ORDER BY tablename
      `);

      const policies = policiesCheck.rows;
      expect(policies.length).toBe(5);

      // Check tenant_isolation policy exists
      expect(
        policies.some((p: any) => p.tablename === 'tenants' && p.policyname === 'tenant_isolation')
      ).toBe(true);

      // Check customer_isolation policy exists
      expect(
        policies.some(
          (p: any) => p.tablename === 'customers' && p.policyname === 'customer_isolation'
        )
      ).toBe(true);

      // Check user_isolation policy exists
      expect(
        policies.some((p: any) => p.tablename === 'users' && p.policyname === 'user_isolation')
      ).toBe(true);

      // Check user_assessment_tenant_isolation policy exists
      expect(
        policies.some(
          (p: any) =>
            p.tablename === 'user_assessments' &&
            p.policyname === 'user_assessment_tenant_isolation'
        )
      ).toBe(true);

      // Check user_assessment_answers_tenant_isolation policy exists
      expect(
        policies.some(
          (p: any) =>
            p.tablename === 'user_assessment_answers' &&
            p.policyname === 'user_assessment_answers_tenant_isolation'
        )
      ).toBe(true);
    });
  });
});
