/**
 * Apply RLS Policies Module
 *
 * This module applies Row-Level Security (RLS) policies to all tenant-scoped tables.
 * It is idempotent and can be run multiple times safely.
 *
 * @module migrations/apply-rls
 */

import { sql } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { terminalPrefix, TerminalPrefix, colorText } from '../lib/terminal-logger';

/**
 * Apply RLS policies to all tenant-scoped tables
 *
 * This function is idempotent - it checks if RLS is already applied before making changes.
 * It will:
 * 1. Enable RLS on tenants, customers, and users tables
 * 2. Force RLS in non-production environments (for testing)
 * 3. Create isolation policies using app.tenant_id context variable
 *
 * @param db - Drizzle database instance
 * @returns Promise<void>
 */
export const applyRLS = async (db: NodePgDatabase<any>): Promise<void> =>{
  console.log(`${terminalPrefix(TerminalPrefix.RLS)} Checking RLS status...`);

  // Check if RLS is already applied to all tables
  const rlsCheck = await db.execute(sql`
    SELECT tablename, rowsecurity
    FROM pg_tables
    WHERE schemaname = 'public'
    AND tablename IN ('tenants', 'customers', 'users', 'user_assessments')
    ORDER BY tablename
  `);

  const tables = rlsCheck.rows as Array<{ tablename: string; rowsecurity: boolean }>;

  // Check if all tables have RLS enabled
  const allTablesHaveRLS = tables.length === 4 && tables.every((t) => t.rowsecurity === true);

  if (allTablesHaveRLS) {
    console.log(`${terminalPrefix(TerminalPrefix.SUCCESS)} RLS already applied to all tables, skipping...`);
    return;
  }

  console.log(`${terminalPrefix(TerminalPrefix.RLS)} Applying RLS policies...`);

  // Apply RLS to all tables in a transaction
  await db.transaction(async (tx) => {
    // ============================================================================
    // TENANTS TABLE RLS
    // ============================================================================

    console.log('  - Enabling RLS on tenants table...');

    await tx.execute(sql`
      ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
    `);

    // Force RLS in development/test environments (for testing with superuser)
    // In production, app_user will have RLS enforced naturally (non-superuser)
    const environment = process.env.ENVIRONMENT || 'development';
    const isProduction = environment === 'production' || environment === 'prod';

    if (!isProduction) {
      console.log(`  - Forcing RLS for ${environment} environment...`);
      await tx.execute(sql`
        ALTER TABLE tenants FORCE ROW LEVEL SECURITY;
      `);
    }

    // Drop existing policy if it exists (for idempotency)
    await tx.execute(sql`
      DROP POLICY IF EXISTS tenant_isolation ON tenants;
    `);

    await tx.execute(sql`
      CREATE POLICY tenant_isolation ON tenants
        FOR ALL
        USING (id = current_setting('app.tenant_id', true)::uuid);
    `);

    // ============================================================================
    // CUSTOMERS TABLE RLS
    // ============================================================================

    console.log('  - Enabling RLS on customers table...');

    await tx.execute(sql`
      ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
    `);

    if (!isProduction) {
      await tx.execute(sql`
        ALTER TABLE customers FORCE ROW LEVEL SECURITY;
      `);
    }

    await tx.execute(sql`
      DROP POLICY IF EXISTS customer_isolation ON customers;
    `);

    await tx.execute(sql`
      CREATE POLICY customer_isolation ON customers
        FOR ALL
        USING (tenant_id = current_setting('app.tenant_id', true)::uuid);
    `);

    // ============================================================================
    // USERS TABLE RLS
    // ============================================================================

    console.log('  - Enabling RLS on users table...');

    await tx.execute(sql`
      ALTER TABLE users ENABLE ROW LEVEL SECURITY;
    `);

    if (!isProduction) {
      await tx.execute(sql`
        ALTER TABLE users FORCE ROW LEVEL SECURITY;
      `);
    }

    await tx.execute(sql`
      DROP POLICY IF EXISTS user_isolation ON users;
    `);

    await tx.execute(sql`
      CREATE POLICY user_isolation ON users
        FOR ALL
        USING (tenant_id = current_setting('app.tenant_id', true)::uuid);
    `);

    // ============================================================================
    // USER_ASSESSMENTS TABLE RLS
    // ============================================================================

    console.log('  - Enabling RLS on user_assessments table...');

    await tx.execute(sql`
      ALTER TABLE user_assessments ENABLE ROW LEVEL SECURITY;
    `);

    if (!isProduction) {
      await tx.execute(sql`
        ALTER TABLE user_assessments FORCE ROW LEVEL SECURITY;
      `);
    }

    await tx.execute(sql`
      DROP POLICY IF EXISTS user_assessment_tenant_isolation ON user_assessments;
    `);

    await tx.execute(sql`
      CREATE POLICY user_assessment_tenant_isolation ON user_assessments
        FOR ALL
        USING (tenant_id = current_setting('app.tenant_id', true)::uuid);
    `);
  });

  console.log(`${terminalPrefix(TerminalPrefix.SUCCESS)} RLS policies applied successfully`);

  // Verify RLS is now enabled
  const verifyCheck = await db.execute(sql`
    SELECT tablename, rowsecurity
    FROM pg_tables
    WHERE schemaname = 'public'
    AND tablename IN ('tenants', 'customers', 'users', 'user_assessments')
    ORDER BY tablename
  `);

  console.log(`${terminalPrefix(TerminalPrefix.RLS)} RLS Status:`);
  for (const row of verifyCheck.rows as Array<{ tablename: string; rowsecurity: boolean }>) {
    const status = row.rowsecurity ? colorText('Enabled', 'green') : colorText('Disabled', 'red');
    console.log(`  - ${row.tablename}: ${status}`);
  }
}
