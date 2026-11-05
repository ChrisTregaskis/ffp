import { isDeployedEnvironment } from '../src/lib/runtime-profile.js';

/**
 * Demo data and `--fresh` create or wipe tenant data, so they only ever run against a local
 * database: never on a deployed profile, and only over a connection marked `DB_TLS_MODE=local`.
 * The second rule covers a laptop `.env` that says development but points at a deployed
 * database. Every other mode verifies TLS against the RDS CA, which only a deployed database
 * passes, and a deployed instance refuses the plaintext connection that local mode opens.
 */
export const assertLocalDatabase = (action: string, env: NodeJS.ProcessEnv = process.env): void => {
  if (isDeployedEnvironment(env.ENVIRONMENT)) {
    throw new Error(`${action} is refused on a deployed environment (${String(env.ENVIRONMENT)})`);
  }

  if (env.DB_TLS_MODE !== 'local') {
    throw new Error(
      `${action} runs only against a local database: set DB_TLS_MODE=local (got ${env.DB_TLS_MODE ?? 'unset'})`
    );
  }
};
