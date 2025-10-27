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

// Load environment variables
dotenv.config();

const getRequiredEnv = (key: string): string => {
  const value = process.env[key];
  if (!value) {
    console.error(`❌ Error: Missing required environment variable: ${key}`);
    process.exit(1);
  }
  return value;
};

// Expected schema structure
const EXPECTED_TABLES = ['tenants', 'customers', 'users'];
const EXPECTED_ENUMS = ['tenant_type', 'customer_status', 'user_role'];

const main = async () => {
  console.log('🔄 Starting migration verification...\n');

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
    console.log('1️⃣ Testing database connection...');
    await pool.query('SELECT 1');
    console.log('   ✅ Connection successful\n');

    // Check tables
    console.log('2️⃣ Verifying tables...');
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
        console.log(`   ✅ Table '${expectedTable}' exists`);
      } else {
        console.error(`   ❌ Table '${expectedTable}' is missing!`);
        process.exit(1);
      }
    }
    console.log('');

    // Check enums
    console.log('3️⃣ Verifying enums...');
    const enumsResult = await pool.query(`
      SELECT typname
      FROM pg_type
      WHERE typtype = 'e'
      ORDER BY typname;
    `);
    const actualEnums = enumsResult.rows.map((row) => row.typname);

    for (const expectedEnum of EXPECTED_ENUMS) {
      if (actualEnums.includes(expectedEnum)) {
        console.log(`   ✅ Enum '${expectedEnum}' exists`);
      } else {
        console.error(`   ❌ Enum '${expectedEnum}' is missing!`);
        process.exit(1);
      }
    }
    console.log('');

    // Check indexes
    console.log('4️⃣ Verifying indexes...');
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
        console.log(`   ✅ ${table}: ${indexes.length} index(es)`);
      }
    } else {
      console.log('   ⚠️  No indexes found (this may be expected for initial schema)');
    }
    console.log('');

    // Check foreign keys
    console.log('5️⃣ Verifying foreign keys...');
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
          `   ✅ ${row.table_name}.${row.column_name} -> ${row.foreign_table_name}.${row.foreign_column_name}`
        );
      }
    } else {
      console.log('   ⚠️  No foreign keys found');
    }
    console.log('');

    // Check RLS policies (future)
    console.log('6️⃣ Verifying RLS policies...');
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
        console.log(`   ✅ ${row.tablename}: ${row.policyname} (${row.cmd})`);
      }
    } else {
      console.log('   ⚠️  No RLS policies found (not yet implemented)');
    }
    console.log('');

    console.log('✅ Migration verification completed successfully!\n');
  } catch (error) {
    console.error('\n❌ Verification failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
};

main();
