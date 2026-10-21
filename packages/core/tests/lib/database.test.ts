import { readFileSync } from 'fs';
import { resolve } from 'path';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { PoolConfig } from 'pg';

// The pool is built when the module loads, so each case stubs the stage and imports it fresh
const { Pool } = vi.hoisted(() => ({
  Pool: vi.fn((_config: PoolConfig) => ({ end: vi.fn() })),
}));

vi.mock('pg', () => ({ Pool }));

// The module reads the CA with require('fs'), which vi.mock can't reach, so the real bundle is read
const RDS_CA_BUNDLE = readFileSync(resolve(__dirname, '../../certs/rds-ca-bundle.pem'), 'utf-8');

const poolConfigForStage = async (stage: {
  SST_STAGE?: string;
  ENVIRONMENT?: string;
}): Promise<PoolConfig | undefined> => {
  vi.stubEnv('SST_STAGE', stage.SST_STAGE);
  vi.stubEnv('ENVIRONMENT', stage.ENVIRONMENT);
  await import('../../src/lib/database');

  expect(Pool).toHaveBeenCalledTimes(1);
  return Pool.mock.lastCall?.[0];
};

describe('database pool TLS', () => {
  beforeEach(() => {
    vi.resetModules();
    Pool.mockClear();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it.each(['production', 'staging'])(
    'verifies the server certificate against the RDS CA on the %s stage',
    async (stage) => {
      const config = await poolConfigForStage({ SST_STAGE: stage });

      expect(config?.ssl).toEqual({ rejectUnauthorized: true, ca: RDS_CA_BUNDLE });
    }
  );

  it('falls back to ENVIRONMENT when SST_STAGE is not set', async () => {
    const config = await poolConfigForStage({ ENVIRONMENT: 'production' });

    expect(config?.ssl).toEqual({ rejectUnauthorized: true, ca: RDS_CA_BUNDLE });
  });

  it.each(['dev', 'chris'])('connects without TLS on the %s stage', async (stage) => {
    const config = await poolConfigForStage({ SST_STAGE: stage });

    expect(config?.ssl).toBe(false);
  });
});
