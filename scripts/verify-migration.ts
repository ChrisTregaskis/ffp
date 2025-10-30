#!/usr/bin/env tsx
/**
 * Migration Verification Script
 *
 * Verifies database schema after migration:
 * - Checks all expected tables exist
 * - Verifies indexes are created
 * - Validates RLS policies (when implemented)
 * - Tests database connection
 *
 * Usage:
 *   pnpm db:verify                    # Verify current environment
 *   ENVIRONMENT=staging pnpm db:verify # Verify staging
 */

import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import { terminalPrefix, TerminalPrefix } from '../packages/database/src/lib/terminal-logger';

// Load environment variables
dotenv.config();

const getRequiredEnv = (key: string): string => {
  const value = process.env[key];
  if (!value) {
    console.error(
      `${terminalPrefix(TerminalPrefix.ERROR)} Missing required environment variable: ${key}`
    );
    process.exit(1);
  }
  return value;
};

// Expected schema structure
const EXPECTED_TABLES = ['tenants', 'customers', 'users'];
const EXPECTED_ENUMS = ['tenant_type', 'customer_status', 'user_role'];

const main = async () => {
  console.log(`${terminalPrefix(TerminalPrefix.INFO)} Starting migration verification...\n`);

  const environment = process.env.ENVIRONMENT || 'development';
  const dbHost = getRequiredEnv('DB_HOST');
  const dbName = getRequiredEnv('DB_NAME');

  console.log(`Environment: ${environment}`);
  console.log(`Host: ${dbHost}`);
  console.log(`Database: ${dbName}\n`);

  const pool = new Pool({
    host: dbHost,
    port: parseInt(process.env.DB_PORT || '5432'),
    database: dbName,
    user: getRequiredEnv('DB_USER'),
    password: getRequiredEnv('DB_PASSWORD'),
    ssl: environment === 'development' ? false : { rejectUnauthorized: true },
  });

  try {
    // Test connection
    console.log('[1] Testing database connection...');
    await pool.query('SELECT 1');
    console.log(`   ${terminalPrefix(TerminalPrefix.SUCCESS)} Connection successful\n`);

    // Check tables
    console.log('[2] Verifying tables...');
    const tablesResult = await pool.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `);
    const actualTables = tablesResult.rows.map((row) => row.table_name);

    for (const expectedTable of EXPECTED_TABLES) {
      if (actualTables.includes(expectedTable)) {
        console.log(`   ${terminalPrefix(TerminalPrefix.SUCCESS)} Table '${expectedTable}' exists`);
      } else {
        console.error(
          `   ${terminalPrefix(TerminalPrefix.ERROR)} Table '${expectedTable}' is missing!`
        );
        process.exit(1);
      }
    }
    console.log('');

    // Check enums
    console.log('[3] Verifying enums...');
    const enumsResult = await pool.query(`
      SELECT typname
      FROM pg_type
      WHERE typtype = 'e'
      ORDER BY typname;
    `);
    const actualEnums = enumsResult.rows.map((row) => row.typname);

    for (const expectedEnum of EXPECTED_ENUMS) {
      if (actualEnums.includes(expectedEnum)) {
        console.log(`   ${terminalPrefix(TerminalPrefix.SUCCESS)} Enum '${expectedEnum}' exists`);
      } else {
        console.error(
          `   ${terminalPrefix(TerminalPrefix.ERROR)} Enum '${expectedEnum}' is missing!`
        );
        process.exit(1);
      }
    }
    console.log('');

    // Check indexes
    console.log('[4] Verifying indexes...');
    const indexesResult = await pool.query(`
      SELECT
        schemaname,
        tablename,
        indexname
      FROM pg_indexes
      WHERE schemaname = 'public'
      ORDER BY tablename, indexname;
    `);

    if (indexesResult.rows.length > 0) {
      const indexesByTable: Record<string, string[]> = {};
      for (const row of indexesResult.rows) {
        if (!indexesByTable[row.tablename]) {
          indexesByTable[row.tablename] = [];
        }
        indexesByTable[row.tablename].push(row.indexname);
      }

      for (const [table, indexes] of Object.entries(indexesByTable)) {
        console.log(
          `   ${terminalPrefix(TerminalPrefix.SUCCESS)} ${table}: ${indexes.length} index(es)`
        );
      }
    } else {
      console.log(
        `   ${terminalPrefix(TerminalPrefix.WARNING)} No indexes found (this may be expected for initial schema)`
      );
    }
    console.log('');

    // Check foreign keys
    console.log('[5] Verifying foreign keys...');
    const fkResult = await pool.query(`
      SELECT
        tc.table_name,
        tc.constraint_name,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY'
      AND tc.table_schema = 'public'
      ORDER BY tc.table_name;
    `);

    if (fkResult.rows.length > 0) {
      for (const row of fkResult.rows) {
        console.log(
          `   ${terminalPrefix(TerminalPrefix.SUCCESS)} ${row.table_name}.${row.column_name} -> ${row.foreign_table_name}.${row.foreign_column_name}`
        );
      }
    } else {
      console.log(`   ${terminalPrefix(TerminalPrefix.WARNING)} No foreign keys found`);
    }
    console.log('');

    // Check RLS policies (future)
    console.log('[6] Verifying RLS policies...');
    const rlsResult = await pool.query(`
      SELECT
        schemaname,
        tablename,
        policyname,
        permissive,
        cmd
      FROM pg_policies
      WHERE schemaname = 'public'
      ORDER BY tablename, policyname;
    `);

    if (rlsResult.rows.length > 0) {
      for (const row of rlsResult.rows) {
        console.log(
          `   ${terminalPrefix(TerminalPrefix.SUCCESS)} ${row.tablename}: ${row.policyname} (${row.cmd})`
        );
      }
    } else {
      console.log(
        `   ${terminalPrefix(TerminalPrefix.WARNING)} No RLS policies found (not yet implemented)`
      );
    }
    console.log('');

    console.log(
      `${terminalPrefix(TerminalPrefix.SUCCESS)} Migration verification completed successfully!\n`
    );
  } catch (error) {
    console.error(`\n${terminalPrefix(TerminalPrefix.ERROR)} Verification failed:`, error);
    process.exit(1);
  } finally {
    await pool.end();
  }
};

main();
