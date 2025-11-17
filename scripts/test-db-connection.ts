/**
 * Database Connection Test Script
 *
 * This script tests the connection to the local PostgreSQL database
 * using the credentials from the .env file.
 */

import { Pool } from 'pg';
import { config } from 'dotenv';
import {
  terminalPrefix,
  TerminalPrefix,
  colorText,
} from '../packages/database/src/lib/terminal-logger';

// Load environment variables
config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'ffp_dev',
  user: process.env.DB_USER || 'root_user',
  password: process.env.DB_PASSWORD,
});

const testConnection = async () => {
  try {
    console.log(`${terminalPrefix(TerminalPrefix.INFO)} Testing database connection...\n`);
    console.log('Configuration:');
    console.log(`  Host: ${process.env.DB_HOST || 'localhost'}`);
    console.log(`  Port: ${process.env.DB_PORT || '5432'}`);
    console.log(`  Database: ${process.env.DB_NAME || 'ffp_dev'}`);
    console.log(`  User: ${process.env.DB_USER || 'root_user'}\n`);

    // Test connection
    const client = await pool.connect();
    console.log(
      `${terminalPrefix(TerminalPrefix.SUCCESS)} Successfully connected to PostgreSQL database!\n`
    );

    // Test query
    const result = await client.query('SELECT version()');
    console.log('PostgreSQL Version:');
    console.log(`  ${result.rows[0].version}\n`);

    // Check if database exists
    const dbCheck = await client.query('SELECT datname FROM pg_database WHERE datname = $1', [
      process.env.DB_NAME || 'ffp_dev',
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

testConnection();
