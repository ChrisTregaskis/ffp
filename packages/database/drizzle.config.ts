import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';

/**
 * Helper function to get required environment variable
 * @param {string} key - The environment variable key
 * @returns {string} The environment variable value
 */
const getRequiredEnv = (key: string): string => {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
};

export default defineConfig({
  schema: './src/schema/**/*.ts',
  out: './migrations',
  dialect: 'postgresql',
  dbCredentials: {
    host: getRequiredEnv('DB_HOST'),
    port: parseInt(process.env.DB_PORT || '5432'),
    user: getRequiredEnv('DB_USER'),
    password: getRequiredEnv('DB_PASSWORD'),
    database: getRequiredEnv('DB_NAME'),
    // SSL: disabled for development (local PostgreSQL), enabled for staging/production (RDS)
    ssl: process.env.ENVIRONMENT === 'development' ? false : { rejectUnauthorized: true },
  },
  // Print all statements for transparency
  verbose: true,
  // Always ask for confirmation before applying migrations
  strict: true,
});
