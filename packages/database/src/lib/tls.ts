import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

export const RDS_CA_BUNDLE_FILE = 'certs/rds-ca-bundle.pem';

export const DB_TLS_MODES = ['verify', 'local'] as const;
export type DbTlsMode = (typeof DB_TLS_MODES)[number];

export type DbTlsConfig = false | { rejectUnauthorized: true; ca: string };

// Deployed functions carry the bundle at the package root (`/var/task`); everywhere else it
// sits in this package. drizzle-kit loads this file as CommonJS, where `import.meta` is empty
// and only `__dirname` locates it.
const caBundlePath = (env: NodeJS.ProcessEnv): string => {
  const moduleUrl = (import.meta as Partial<ImportMeta>).url;
  const here = moduleUrl ? dirname(fileURLToPath(moduleUrl)) : __dirname;

  return join(env.LAMBDA_TASK_ROOT ?? join(here, '../..'), RDS_CA_BUNDLE_FILE);
};

/**
 * TLS settings for every Postgres connection. Fails closed: TLS verified against the pinned
 * RDS CA unless the connection is explicitly marked local with `DB_TLS_MODE=local`.
 */
export const dbTlsConfig = (env: NodeJS.ProcessEnv = process.env): DbTlsConfig => {
  const mode = env.DB_TLS_MODE;

  if (mode === 'local') {
    return false;
  }

  if (mode && mode !== 'verify') {
    throw new Error(`DB_TLS_MODE must be one of ${DB_TLS_MODES.join(', ')}, got "${mode}"`);
  }

  return { rejectUnauthorized: true, ca: readFileSync(caBundlePath(env), 'utf-8') };
};
