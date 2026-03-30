/**
 * Apply RLS Policies Module
 *
 * This module applies Row-Level Security (RLS) policies to all organisation-scoped tables.
 * It is idempotent and can be run multiple times safely.
 *
 * **Tables with RLS policies:**
 * - organisations, locations, users, user_assessments, user_assessment_answers, programmes, programme_phases, user_sessions, exercise_completions
 *
 * **Admin bypass policy:**
 * - locations and users tables have an additional permissive policy that grants
 *   full access when `app.is_admin = 'true'` is set. This allows system_admin
 *   queries to operate cross-organisation without disabling RLS.
 *   Use `setAdminContext(tx)` from `@ffp/database` to activate.
 *
 * **Tables intentionally without RLS (for MVP):**
 * - process_jobs: Job processor runs with BYPASSRLS to claim jobs across organisations.
 *   RLS will be added when user-facing job queries are implemented (see process-jobs.ts).
 * - assessment_templates, assessment_flows, questions, template_questions:
 *   System-managed content, no organisation isolation.
 * - programme_templates, template_phases, template_sessions, session_exercises, videos:
 *   System-managed content, shared across all organisations.
 *
 * @module migrations/apply-rls
 */

import { sql } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { createLogger } from '../lib/logger';

const logger = createLogger('apply-rls');

/**
 * Apply RLS policies to all organisation-scoped tables
 *
 * This function is idempotent - it checks if RLS is already applied before making changes.
 * It will:
 * 1. Enable RLS on organisations, locations, and users tables
 * 2. Force RLS in non-production environments (for testing)
 * 3. Create isolation policies using app.organisation_id context variable
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
    AND tablename IN ('organisations', 'locations', 'users', 'user_assessments', 'user_assessment_answers', 'programmes', 'programme_phases', 'user_sessions', 'exercise_completions')
    ORDER BY tablename
  `);

  const tables = rlsCheck.rows as Array<{ tablename: string; rowsecurity: boolean }>;

  // Check if all tables have RLS enabled (9 tables)
  const allTablesHaveRLS = tables.length === 9 && tables.every((t) => t.rowsecurity === true);

  if (allTablesHaveRLS) {
    logger.info('RLS already enabled on all tables, re-applying policies to pick up any changes...');
  } else {
    logger.info('Applying RLS policies...');
  }

  // Apply RLS to all tables in a transaction
  await db.transaction(async (tx) => {
    // ============================================================================
    // ORGANISATIONS TABLE RLS
    // ============================================================================

    logger.debug('Enabling RLS on organisations table...');

    await tx.execute(sql`
      ALTER TABLE organisations ENABLE ROW LEVEL SECURITY;
    `);

    // Force RLS in development/test environments (for testing with superuser)
    // In production, app_user will have RLS enforced naturally (non-superuser)
    const environment = process.env.ENVIRONMENT || 'development';
    const isProduction = environment === 'production' || environment === 'prod';

    if (!isProduction) {
      logger.debug('Forcing RLS for environment', { environment });
      await tx.execute(sql`
        ALTER TABLE organisations FORCE ROW LEVEL SECURITY;
      `);
    }

    // Drop existing policies (for idempotency)
    await tx.execute(sql`
      DROP POLICY IF EXISTS tenant_isolation ON organisations;
    `);

    await tx.execute(sql`
      DROP POLICY IF EXISTS tenant_read_isolation ON organisations;
    `);

    await tx.execute(sql`
      DROP POLICY IF EXISTS tenant_write_isolation ON organisations;
    `);

    await tx.execute(sql`
      DROP POLICY IF EXISTS tenant_admin_bypass ON organisations;
    `);

    await tx.execute(sql`
      DROP POLICY IF EXISTS organisation_read_isolation ON organisations;
    `);

    await tx.execute(sql`
      DROP POLICY IF EXISTS organisation_write_isolation ON organisations;
    `);

    await tx.execute(sql`
      DROP POLICY IF EXISTS organisation_admin_bypass ON organisations;
    `);

    // Read policy: own organisation + platform organisation (for default flow lookup)
    await tx.execute(sql`
      CREATE POLICY organisation_read_isolation ON organisations
        FOR SELECT
        USING (
          id = current_setting('app.organisation_id', true)::uuid
          OR type = 'platform'
        );
    `);

    // Write policy: own organisation only
    await tx.execute(sql`
      CREATE POLICY organisation_write_isolation ON organisations
        FOR ALL
        USING (id = current_setting('app.organisation_id', true)::uuid);
    `);

    // Admin bypass: system_admin queries set app.is_admin = 'true' for cross-organisation access
    await tx.execute(sql`
      CREATE POLICY organisation_admin_bypass ON organisations
        FOR ALL
        USING (current_setting('app.is_admin', true) = 'true');
    `);

    // ============================================================================
    // LOCATIONS TABLE RLS
    // ============================================================================

    logger.debug('Enabling RLS on locations table...');

    await tx.execute(sql`
      ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
    `);

    if (!isProduction) {
      await tx.execute(sql`
        ALTER TABLE locations FORCE ROW LEVEL SECURITY;
      `);
    }

    await tx.execute(sql`
      DROP POLICY IF EXISTS customer_isolation ON locations;
    `);

    await tx.execute(sql`
      DROP POLICY IF EXISTS customer_admin_bypass ON locations;
    `);

    await tx.execute(sql`
      DROP POLICY IF EXISTS location_isolation ON locations;
    `);

    await tx.execute(sql`
      DROP POLICY IF EXISTS location_admin_bypass ON locations;
    `);

    // Organisation isolation: normal users see only their organisation's locations
    await tx.execute(sql`
      CREATE POLICY location_isolation ON locations
        FOR ALL
        USING (organisation_id = current_setting('app.organisation_id', true)::uuid);
    `);

    // Admin bypass: system_admin queries set app.is_admin = 'true' for cross-organisation access
    await tx.execute(sql`
      CREATE POLICY location_admin_bypass ON locations
        FOR ALL
        USING (current_setting('app.is_admin', true) = 'true');
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
      DROP POLICY IF EXISTS user_admin_bypass ON users;
    `);

    // Organisation isolation: normal users see only their organisation's users
    await tx.execute(sql`
      CREATE POLICY user_isolation ON users
        FOR ALL
        USING (organisation_id = current_setting('app.organisation_id', true)::uuid);
    `);

    // Admin bypass: system_admin queries set app.is_admin = 'true' for cross-organisation access
    await tx.execute(sql`
      CREATE POLICY user_admin_bypass ON users
        FOR ALL
        USING (current_setting('app.is_admin', true) = 'true');
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
      DROP POLICY IF EXISTS user_assessment_organisation_isolation ON user_assessments;
    `);

    await tx.execute(sql`
      CREATE POLICY user_assessment_organisation_isolation ON user_assessments
        FOR ALL
        USING (organisation_id = current_setting('app.organisation_id', true)::uuid);
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
      DROP POLICY IF EXISTS user_assessment_answers_organisation_isolation ON user_assessment_answers;
    `);

    await tx.execute(sql`
      CREATE POLICY user_assessment_answers_organisation_isolation ON user_assessment_answers
        FOR ALL
        USING (organisation_id = current_setting('app.organisation_id', true)::uuid);
    `);

    // ============================================================================
    // PROGRAMMES TABLE RLS
    // ============================================================================

    logger.debug('Enabling RLS on programmes table...');

    await tx.execute(sql`
      ALTER TABLE programmes ENABLE ROW LEVEL SECURITY;
    `);

    if (!isProduction) {
      await tx.execute(sql`
        ALTER TABLE programmes FORCE ROW LEVEL SECURITY;
      `);
    }

    await tx.execute(sql`
      DROP POLICY IF EXISTS programme_organisation_isolation ON programmes;
    `);

    await tx.execute(sql`
      CREATE POLICY programme_organisation_isolation ON programmes
        FOR ALL
        USING (organisation_id = current_setting('app.organisation_id', true)::uuid);
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
      DROP POLICY IF EXISTS programme_phases_organisation_isolation ON programme_phases;
    `);

    await tx.execute(sql`
      CREATE POLICY programme_phases_organisation_isolation ON programme_phases
        FOR ALL
        USING (organisation_id = current_setting('app.organisation_id', true)::uuid);
    `);

    // ============================================================================
    // USER_SESSIONS TABLE RLS
    // ============================================================================

    logger.debug('Enabling RLS on user_sessions table...');

    await tx.execute(sql`
      ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
    `);

    if (!isProduction) {
      await tx.execute(sql`
        ALTER TABLE user_sessions FORCE ROW LEVEL SECURITY;
      `);
    }

    await tx.execute(sql`
      DROP POLICY IF EXISTS user_sessions_organisation_isolation ON user_sessions;
    `);

    await tx.execute(sql`
      CREATE POLICY user_sessions_organisation_isolation ON user_sessions
        FOR ALL
        USING (organisation_id = current_setting('app.organisation_id', true)::uuid);
    `);

    // ============================================================================
    // EXERCISE_COMPLETIONS TABLE RLS
    // ============================================================================

    logger.debug('Enabling RLS on exercise_completions table...');

    await tx.execute(sql`
      ALTER TABLE exercise_completions ENABLE ROW LEVEL SECURITY;
    `);

    if (!isProduction) {
      await tx.execute(sql`
        ALTER TABLE exercise_completions FORCE ROW LEVEL SECURITY;
      `);
    }

    await tx.execute(sql`
      DROP POLICY IF EXISTS exercise_completions_organisation_isolation ON exercise_completions;
    `);

    await tx.execute(sql`
      CREATE POLICY exercise_completions_organisation_isolation ON exercise_completions
        FOR ALL
        USING (organisation_id = current_setting('app.organisation_id', true)::uuid);
    `);
  });

  logger.info('RLS policies applied successfully');

  // Verify RLS is now enabled
  const verifyCheck = await db.execute(sql`
    SELECT tablename, rowsecurity
    FROM pg_tables
    WHERE schemaname = 'public'
    AND tablename IN ('organisations', 'locations', 'users', 'user_assessments', 'user_assessment_answers', 'programmes', 'programme_phases', 'user_sessions', 'exercise_completions')
    ORDER BY tablename
  `);

  logger.info('RLS Status:');
  for (const row of verifyCheck.rows as Array<{ tablename: string; rowsecurity: boolean }>) {
    const status = row.rowsecurity ? 'Enabled' : 'Disabled';
    logger.info(`  ${row.tablename}: ${status}`, { table: row.tablename, enabled: row.rowsecurity });
  }
};
