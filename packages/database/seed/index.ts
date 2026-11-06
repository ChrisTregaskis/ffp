import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

import { createLogger } from '../src/lib/logger.js';
import { connectAsMigrator } from '../src/migrations/connection.js';
import { seedReference } from '../src/seed/reference.js';

import { seedDemo } from './demo.js';
import { assertLocalDatabase } from './guard.js';

import type { SeedConfig } from './types.js';

const logger = createLogger('seed');

const __dirname = dirname(fileURLToPath(import.meta.url));

/** The demo seed's tenants and users, from the gitignored db-seed.local.{environment}.json */
const loadSeedConfig = (environment: string): SeedConfig => {
  const configPath = resolve(__dirname, `config/db-seed.local.${environment}.json`);

  try {
    return JSON.parse(readFileSync(configPath, 'utf-8')) as SeedConfig;
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
      throw new Error(
        `Seed config not found: ${configPath}\n` +
          `Create this file based on config/db-seed.example.json`
      );
    }

    throw error;
  }
};

export interface SeedOptions {
  /** Adds the local demo on top of the reference data */
  demo: boolean;
  /** Empties the catalogue and member data first; identity data is kept */
  fresh: boolean;
  /** Names the demo config file */
  environment: string;
}

/**
 * Seeds the reference data and, when asked, the local demo. Connects as the schema owner. The
 * demo and `--fresh` are refused unless the database is local.
 */
export const seedDatabase = async ({ demo, fresh, environment }: SeedOptions): Promise<void> => {
  if (demo) {
    assertLocalDatabase('The demo seed');
  }

  if (fresh) {
    assertLocalDatabase('--fresh');
  }

  const config = demo ? loadSeedConfig(environment) : undefined;
  const db = connectAsMigrator();

  try {
    if (fresh) {
      logger.info('Fresh mode: truncating seed content tables (preserving identity data)...');
      await db.$client.query(`
        TRUNCATE assessment_flows, assessment_templates, questions, programme_templates, videos,
                 template_phases, template_sessions, session_exercises,
                 programmes, programme_phases, user_sessions, user_session_exercises, exercise_completions CASCADE;
      `);
    }

    await seedReference(db);

    if (config) {
      await seedDemo(db, config);
    }

    logger.info('Database seeding complete');
  } finally {
    await db.$client.end();
  }
};

export { seedReference } from '../src/seed/reference.js';
export { seedDemo } from './demo.js';
