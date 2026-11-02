import type { DbTlsMode } from './tls';

export interface RuntimeProfile {
  ENVIRONMENT: 'production' | 'production-like' | 'development';
  NODE_ENV: 'production' | 'development';
  LOG_LEVEL: 'INFO' | 'DEBUG';
  DB_TLS_MODE: DbTlsMode;
}

const PRODUCTION: RuntimeProfile = {
  ENVIRONMENT: 'production',
  NODE_ENV: 'production',
  LOG_LEVEL: 'INFO',
  DB_TLS_MODE: 'verify',
};

const PRODUCTION_LIKE: RuntimeProfile = { ...PRODUCTION, ENVIRONMENT: 'production-like' };

// Only `sst dev` runs functions locally against local Postgres
const DEVELOPMENT: RuntimeProfile = {
  ENVIRONMENT: 'development',
  NODE_ENV: 'development',
  LOG_LEVEL: 'DEBUG',
  DB_TLS_MODE: 'local',
};

/**
 * The runtime environment every function in a stage receives. Decided here, once, so no
 * function infers its environment from the stage name or from a variable left unset. A
 * deployed stage that is neither production nor prerelease is treated as production-like,
 * so TLS can only be off under `sst dev`.
 */
export const runtimeProfileForStage = (stage: string, isDevMode: boolean): RuntimeProfile => {
  if (stage === 'production') {
    return PRODUCTION;
  }

  if (stage === 'prerelease' || !isDevMode) {
    return PRODUCTION_LIKE;
  }

  return DEVELOPMENT;
};
