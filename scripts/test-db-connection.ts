/**
 * Database Connection Test Script
 *
 * This script tests the connection to the local PostgreSQL database
 * using the credentials from the .env file.
 */

import { config } from 'dotenv';
import { Pool } from 'pg';

import {
  terminalPrefix,
  TerminalPrefix,
  colorText,
} from '../packages/database/src/lib/terminal-logger';
import { dbTlsConfig } from '../packages/database/src/lib/tls';

// Load environment variables
config();

// An empty value falls back too
const envOr = (key: string, fallback: string): string => {
  const value = process.env[key];

  return value ? value : fallback;
};

const settings = {
  host: envOr('DB_HOST', 'localhost'),
  port: envOr('DB_PORT', '5432'),
  database: envOr('DB_NAME', 'ffp_dev'),
  user: envOr('DB_USER', 'root_user'),
};

const pool = new Pool({
  ...settings,
  port: parseInt(settings.port),
  password: process.env.DB_PASSWORD,
  ssl: dbTlsConfig(),
});

const testConnection = async (): Promise<void> => {
  try {
    console.log(`${terminalPrefix(TerminalPrefix.INFO)} Testing database connection...\n`);
    console.log('Configuration:');
    console.log(`  Host: ${settings.host}`);
    console.log(`  Port: ${settings.port}`);
    console.log(`  Database: ${settings.database}`);
    console.log(`  User: ${settings.user}\n`);

    // Test connection
    const client = await pool.connect();
    console.log(
      `${terminalPrefix(TerminalPrefix.SUCCESS)} Successfully connected to PostgreSQL database!\n`
    );

    // Test query
    const result = await client.query<{ version: string }>('SELECT version()');
    console.log('PostgreSQL Version:');
    console.log(`  ${result.rows[0].version}\n`);

    // Check if database exists
    const dbCheck = await client.query('SELECT datname FROM pg_database WHERE datname = $1', [
      settings.database,
    ]);

    if (dbCheck.rows.length > 0) {
      console.log(`${terminalPrefix(TerminalPrefix.SUCCESS)} Database exists\n`);
    } else {
      console.log(`${terminalPrefix(TerminalPrefix.ERROR)} Database does not exist\n`);
    }

    client.release();
    await pool.end();

    console.log(
      `${terminalPrefix(TerminalPrefix.SUCCESS)} Connection test completed successfully!\n`
    );
    process.exit(0);
  } catch (error) {
    console.error(`${terminalPrefix(TerminalPrefix.ERROR)} Connection test failed:\n`);

    if (error instanceof Error) {
      console.error(`  Error: ${error.message}\n`);

      if (error.message.includes('ECONNREFUSED')) {
        console.error(
          `  ${colorText('TIP:', 'yellow')} PostgreSQL server is not running or not accessible.`
        );
        console.error('     Please ensure PostgreSQL is installed and running.\n');
      } else if (error.message.includes('password authentication failed')) {
        console.error(`  ${colorText('TIP:', 'yellow')} Invalid credentials.`);
        console.error('     Please check your .env file.\n');
      } else if (error.message.includes('does not exist')) {
        console.error(`  ${colorText('TIP:', 'yellow')} Database or user does not exist.`);
        console.error('     Please create them using the setup script.\n');
      }
    } else {
      console.error(error);
    }

    await pool.end();
    process.exit(1);
  }
};

void testConnection();
