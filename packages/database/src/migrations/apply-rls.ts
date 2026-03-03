/**
 * Apply RLS Policies Module
 *
 * This module applies Row-Level Security (RLS) policies to all tenant-scoped tables.
 * It is idempotent and can be run multiple times safely.
 *
 * **Tables with RLS policies:**
 * - tenants, customers, users, user_assessments, user_assessment_answers, programme_phases
 *
 * **Tables intentionally without RLS (for MVP):**
 * - process_jobs: Job processor runs with BYPASSRLS to claim jobs across tenants.
 *   RLS will be added when user-facing job queries are implemented (see process-jobs.ts).
 * - assessment_templates, assessment_flows, questions, template_questions:
 *   System-managed content, no tenant isolation.
 * - programme_templates, template_phases, template_sessions, session_exercises, videos:
 *   System-managed content, shared across all tenants.
 *
 * @module migrations/apply-rls
 */

import { sql } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { createLogger } from '../lib/logger';

const logger = createLogger('apply-rls');

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
export const applyRLS = async (db: NodePgDatabase<any>): Promise<void> => {
  logger.info('Checking RLS status...');

  // Check if RLS is already applied to all tables
  const rlsCheck = await db.execute(sql`
    SELECT tablename, rowsecurity
    FROM pg_tables
    WHERE schemaname = 'public'
    AND tablename IN ('tenants', 'customers', 'users', 'user_assessments', 'user_assessment_answers', 'programme_phases')
    ORDER BY tablename
  `);

  const tables = rlsCheck.rows as Array<{ tablename: string; rowsecurity: boolean }>;

  // Check if all tables have RLS enabled (6 tables now)
  const allTablesHaveRLS = tables.length === 6 && tables.every((t) => t.rowsecurity === true);

  if (allTablesHaveRLS) {
    logger.info('RLS already enabled on all tables, re-applying policies to pick up any changes...');
  } else {
    logger.info('Applying RLS policies...');
  }

  // Apply RLS to all tables in a transaction
  await db.transaction(async (tx) => {
    // ============================================================================
    // TENANTS TABLE RLS
    // ============================================================================

    logger.debug('Enabling RLS on tenants table...');

    await tx.execute(sql`
      ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
    `);

    // Force RLS in development/test environments (for testing with superuser)
    // In production, app_user will have RLS enforced naturally (non-superuser)
    const environment = process.env.ENVIRONMENT || 'development';
    const isProduction = environment === 'production' || environment === 'prod';

    if (!isProduction) {
      logger.debug('Forcing RLS for environment', { environment });
      await tx.execute(sql`
        ALTER TABLE tenants FORCE ROW LEVEL SECURITY;
      `);
    }

    // Drop existing policies (for idempotency)
    await tx.execute(sql`
      DROP POLICY IF EXISTS tenant_isolation ON tenants;
    `);

    await tx.execute(sql`
      DROP POLICY IF EXISTS tenant_read_isolation ON tenants;
    `);

    await tx.execute(sql`
      DROP POLICY IF EXISTS tenant_write_isolation ON tenants;
    `);

    // Read policy: own tenant + platform tenant (for default flow lookup)
    await tx.execute(sql`
      CREATE POLICY tenant_read_isolation ON tenants
        FOR SELECT
        USING (
          id = current_setting('app.tenant_id', true)::uuid
          OR type = 'platform'
        );
    `);

    // Write policy: own tenant only
    await tx.execute(sql`
      CREATE POLICY tenant_write_isolation ON tenants
        FOR ALL
        USING (id = current_setting('app.tenant_id', true)::uuid);
    `);

    // ============================================================================
    // CUSTOMERS TABLE RLS
    // ============================================================================

    logger.debug('Enabling RLS on customers table...');

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

    logger.debug('Enabling RLS on users table...');

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

    logger.debug('Enabling RLS on user_assessments table...');

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

    // ============================================================================
    // USER_ASSESSMENT_ANSWERS TABLE RLS
    // ============================================================================

    logger.debug('Enabling RLS on user_assessment_answers table...');

    await tx.execute(sql`
      ALTER TABLE user_assessment_answers ENABLE ROW LEVEL SECURITY;
    `);

    if (!isProduction) {
      await tx.execute(sql`
        ALTER TABLE user_assessment_answers FORCE ROW LEVEL SECURITY;
      `);
    }

    await tx.execute(sql`
      DROP POLICY IF EXISTS user_assessment_answers_tenant_isolation ON user_assessment_answers;
    `);

    await tx.execute(sql`
      CREATE POLICY user_assessment_answers_tenant_isolation ON user_assessment_answers
        FOR ALL
        USING (tenant_id = current_setting('app.tenant_id', true)::uuid);
    `);

    // ============================================================================
    // PROGRAMME_PHASES TABLE RLS
    // ============================================================================

    logger.debug('Enabling RLS on programme_phases table...');

    await tx.execute(sql`
      ALTER TABLE programme_phases ENABLE ROW LEVEL SECURITY;
    `);

    if (!isProduction) {
      await tx.execute(sql`
        ALTER TABLE programme_phases FORCE ROW LEVEL SECURITY;
      `);
    }

    await tx.execute(sql`
      DROP POLICY IF EXISTS programme_phases_tenant_isolation ON programme_phases;
    `);

    await tx.execute(sql`
      CREATE POLICY programme_phases_tenant_isolation ON programme_phases
        FOR ALL
        USING (tenant_id = current_setting('app.tenant_id', true)::uuid);
    `);
  });

  logger.info('RLS policies applied successfully');

  // Verify RLS is now enabled
  const verifyCheck = await db.execute(sql`
    SELECT tablename, rowsecurity
    FROM pg_tables
    WHERE schemaname = 'public'
    AND tablename IN ('tenants', 'customers', 'users', 'user_assessments', 'user_assessment_answers', 'programme_phases')
    ORDER BY tablename
  `);

  logger.info('RLS Status:');
  for (const row of verifyCheck.rows as Array<{ tablename: string; rowsecurity: boolean }>) {
    const status = row.rowsecurity ? 'Enabled' : 'Disabled';
    logger.info(`  ${row.tablename}: ${status}`, { table: row.tablename, enabled: row.rowsecurity });
  }
};
