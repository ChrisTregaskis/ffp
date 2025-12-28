/**
 * Drizzle ORM Unit Tests
 *
 * Tests configuration, schema types, and migration structure
 * without requiring a database connection.
 *
 * @module __tests__/drizzle.test
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { getDb, closeDb } from '../src/client';
import { users, tenants, customers } from '../src/schema';

describe('Drizzle ORM Configuration', () => {
  beforeAll(() => {
    // Setup test environment variables
    // IMPORTANT: test_user does NOT have BYPASSRLS, so RLS policies are enforced
    process.env.DB_HOST = 'localhost';
    process.env.DB_PORT = '5432';
    process.env.DB_NAME = 'ffp_test';
    process.env.DB_USER = 'test_user';
    process.env.DB_PASSWORD = 'test_password';
    process.env.DB_SSL = 'false';
  });

  afterAll(async () => {
    // Clean up connection pool
    await closeDb();
  });

  describe('Connection Pool', () => {
    it('should initialise connection pool correctly', () => {
      const db = getDb();
      expect(db).toBeDefined();
      expect(db).toHaveProperty('query');
      expect(db).toHaveProperty('select');
      expect(db).toHaveProperty('insert');
    });

    it('should return the same instance on multiple calls (singleton)', () => {
      const db1 = getDb();
      const db2 = getDb();

      expect(db1).toBe(db2);
    });
  });

  describe('Schema Types - Tenants', () => {
    it('should have correct insert type for tenants table', () => {
      // Test that the type can be created with required fields only
      const newTenant: typeof tenants.$inferInsert = {
        id: '123e4567-e89b-12d3-a456-426614174001',
        type: 'individual',
        name: 'John Doe',
      };

      expect(newTenant).toBeDefined();
      expect(newTenant.type).toBe('individual');
      expect(newTenant.name).toBe('John Doe');
    });

    it('should have correct select type for tenants table', () => {
      const selectedTenant: typeof tenants.$inferSelect = {
        id: '123e4567-e89b-12d3-a456-426614174001',
        type: 'business',
        name: 'Acme Corp',
        settings: { theme: 'light' },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      expect(selectedTenant).toBeDefined();
      expect(selectedTenant).toHaveProperty('createdAt');
      expect(selectedTenant).toHaveProperty('updatedAt');
    });

    it('should validate tenant type enum values', () => {
      // Valid types
      const individual: typeof tenants.$inferInsert = {
        id: '123e4567-e89b-12d3-a456-426614174001',
        type: 'individual',
        name: 'Test',
      };

      const business: typeof tenants.$inferInsert = {
        id: '123e4567-e89b-12d3-a456-426614174002',
        type: 'business',
        name: 'Test Business',
      };

      expect(individual.type).toBe('individual');
      expect(business.type).toBe('business');
    });
  });

  describe('Schema Types - Customers', () => {
    it('should have correct insert type for customers table', () => {
      const newCustomer: typeof customers.$inferInsert = {
        tenantId: '123e4567-e89b-12d3-a456-426614174001',
        name: 'Customer One',
        accountCode: 'CUST-001',
        status: 'active',
      };

      expect(newCustomer).toBeDefined();
      expect(newCustomer.status).toBe('active');
    });

    it('should have correct select type for customers table', () => {
      const selectedCustomer: typeof customers.$inferSelect = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        tenantId: '123e4567-e89b-12d3-a456-426614174001',
        name: 'Customer One',
        accountCode: 'CUST-001',
        status: 'active',
        address: {
          line1: '123 Test Street',
          line2: 'Suite 100',
          city: 'London',
          county: 'Greater London',
          postcode: 'SW1A 1AA',
          country: 'United Kingdom',
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      expect(selectedCustomer).toBeDefined();
      expect(selectedCustomer).toHaveProperty('accountCode');
      expect(selectedCustomer).toHaveProperty('address');
    });

    it('should validate customer status enum values', () => {
      const activeCustomer: typeof customers.$inferInsert = {
        tenantId: '123e4567-e89b-12d3-a456-426614174001',
        name: 'Active Customer',
        accountCode: 'CUST-001',
        status: 'active',
      };

      const suspendedCustomer: typeof customers.$inferInsert = {
        tenantId: '123e4567-e89b-12d3-a456-426614174001',
        name: 'Suspended Customer',
        accountCode: 'CUST-002',
        status: 'suspended',
      };

      const inactiveCustomer: typeof customers.$inferInsert = {
        tenantId: '123e4567-e89b-12d3-a456-426614174001',
        name: 'Inactive Customer',
        accountCode: 'CUST-003',
        status: 'inactive',
      };

      expect(activeCustomer.status).toBe('active');
      expect(suspendedCustomer.status).toBe('suspended');
      expect(inactiveCustomer.status).toBe('inactive');
    });

    it('should support optional address field', () => {
      const customerWithoutAddress: typeof customers.$inferInsert = {
        tenantId: '123e4567-e89b-12d3-a456-426614174001',
        name: 'Test Customer',
        accountCode: 'CUST-001',
        status: 'active',
      };

      const customerWithAddress: typeof customers.$inferInsert = {
        tenantId: '123e4567-e89b-12d3-a456-426614174001',
        name: 'Test Customer 2',
        accountCode: 'CUST-002',
        status: 'active',
        address: {
          line1: '456 Main Road',
          city: 'Manchester',
          postcode: 'M1 1AA',
          country: 'United Kingdom',
        },
      };

      expect(customerWithoutAddress).toBeDefined();
      expect(customerWithAddress.address).toBeDefined();
      expect(customerWithAddress.address?.city).toBe('Manchester');
    });
  });

  describe('Schema Types - Users', () => {
    it('should have correct insert type for users table', () => {
      const newUser: typeof users.$inferInsert = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        tenantId: '123e4567-e89b-12d3-a456-426614174001',
        email: 'test@example.com',
        cognitoSub: 'cognito-sub-123',
        firstName: 'John',
        lastName: 'Doe',
        role: 'individual_user',
      };

      expect(newUser).toBeDefined();
      expect(newUser.email).toBe('test@example.com');
      expect(newUser.role).toBe('individual_user');
    });

    it('should have correct select type for users table', () => {
      const selectedUser: typeof users.$inferSelect = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        tenantId: '123e4567-e89b-12d3-a456-426614174001',
        customerId: null,
        email: 'test@example.com',
        cognitoSub: 'cognito-sub-123',
        firstName: 'John',
        lastName: 'Doe',
        role: 'individual_user',
        profileImageUrl: null,
        phone: null,
        dateOfBirth: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      expect(selectedUser).toBeDefined();
      expect(selectedUser).toHaveProperty('createdAt');
      expect(selectedUser).toHaveProperty('customerId');
    });

    it('should validate user role enum values', () => {
      const individualUser: typeof users.$inferInsert = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        tenantId: '123e4567-e89b-12d3-a456-426614174001',
        email: 'individual@test.com',
        cognitoSub: 'cognito-1',
        firstName: 'John',
        lastName: 'Doe',
        role: 'individual_user',
      };

      const customerAdmin: typeof users.$inferInsert = {
        id: '123e4567-e89b-12d3-a456-426614174001',
        tenantId: '123e4567-e89b-12d3-a456-426614174001',
        email: 'admin@test.com',
        cognitoSub: 'cognito-2',
        firstName: 'Jane',
        lastName: 'Admin',
        role: 'customer_admin',
      };

      expect(['individual_user', 'customer_admin', 'customer_user']).toContain(individualUser.role);
      expect(['individual_user', 'customer_admin', 'customer_user']).toContain(customerAdmin.role);
    });
  });
});

describe('Migration System', () => {
  it('should have migration files in migrations directory', async () => {
    const fs = await import('fs/promises');
    const path = await import('path');

    const migrationsDir = path.join(__dirname, '../migrations');

    try {
      const files = await fs.readdir(migrationsDir);

      // Should have at least one migration file
      expect(files.length).toBeGreaterThan(0);

      // Migration files should be SQL files
      const sqlFiles = files.filter((f) => f.endsWith('.sql'));
      expect(sqlFiles.length).toBeGreaterThan(0);
    } catch (error) {
      throw new Error(`Migrations directory not found: ${migrationsDir}`);
    }
  });

  it('should have migration with expected table creation SQL', async () => {
    const fs = await import('fs/promises');
    const path = await import('path');

    const migrationsDir = path.join(__dirname, '../migrations');
    const files = await fs.readdir(migrationsDir);

    // Read the first .sql migration file
    const sqlFile = files.find((f) => f.endsWith('.sql'));
    expect(sqlFile).toBeDefined();

    if (sqlFile) {
      const migrationContent = await fs.readFile(path.join(migrationsDir, sqlFile), 'utf-8');

      // Verify migration contains table creation
      expect(migrationContent).toContain('CREATE TABLE');
      expect(migrationContent).toContain('tenants');
      expect(migrationContent).toContain('customers');
      expect(migrationContent).toContain('users');

      // Verify enums are created
      expect(migrationContent).toContain('CREATE TYPE');
      expect(migrationContent).toContain('tenant_type');
      expect(migrationContent).toContain('customer_status');
      expect(migrationContent).toContain('user_role');
    }
  });

  it('should have RLS migration script available', async () => {
    const fs = await import('fs/promises');
    const path = await import('path');

    const rlsScriptPath = path.join(__dirname, '../src/migrations/apply-rls.ts');

    // Verify RLS script exists (RLS is applied via separate script, not in SQL migration)
    try {
      const stats = await fs.stat(rlsScriptPath);
      expect(stats.isFile()).toBe(true);

      // Read the file to verify it contains RLS logic
      const content = await fs.readFile(rlsScriptPath, 'utf-8');
      expect(content).toContain('ENABLE ROW LEVEL SECURITY');
      expect(content).toContain('CREATE POLICY');
    } catch (error) {
      throw new Error(`RLS script not found at ${rlsScriptPath}`);
    }
  });

  it('should have proper foreign key constraints in migration', async () => {
    const fs = await import('fs/promises');
    const path = await import('path');

    const migrationsDir = path.join(__dirname, '../migrations');
    const files = await fs.readdir(migrationsDir);

    const sqlFile = files.find((f) => f.endsWith('.sql'));
    expect(sqlFile).toBeDefined();

    if (sqlFile) {
      const migrationContent = await fs.readFile(path.join(migrationsDir, sqlFile), 'utf-8');

      // Verify foreign key relationships
      expect(migrationContent).toContain('REFERENCES');
      // Note: Drizzle generates lowercase 'cascade'
      expect(migrationContent.toLowerCase()).toContain('on delete cascade');
    }
  });
});
