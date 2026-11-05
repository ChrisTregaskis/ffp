import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { seedDatabase } from '../seed';
import { assertLocalDatabase } from '../seed/guard';

describe('assertLocalDatabase', () => {
  it.each(['production', 'production-like'])(
    'refuses a deployed environment (%s) even over a local connection',
    (environment) => {
      expect(() => {
        assertLocalDatabase('The demo seed', { ENVIRONMENT: environment, DB_TLS_MODE: 'local' });
      }).toThrow(`The demo seed is refused on a deployed environment (${environment})`);
    }
  );

  // A laptop .env saying development while pointing at a deployed database
  it.each([
    ['verify', 'verify'],
    ['unset', undefined],
  ])('refuses development when TLS mode is %s', (_label, mode) => {
    expect(() => {
      assertLocalDatabase('--fresh', { ENVIRONMENT: 'development', DB_TLS_MODE: mode });
    }).toThrow(/--fresh runs only against a local database: set DB_TLS_MODE=local/);
  });

  it.each(['development', 'test', undefined])(
    'allows a local connection when ENVIRONMENT is %s',
    (environment) => {
      expect(() => {
        assertLocalDatabase('The demo seed', { ENVIRONMENT: environment, DB_TLS_MODE: 'local' });
      }).not.toThrow();
    }
  );
});

describe('seedDatabase', () => {
  // If the guard ever stops refusing, the run fails at the credentials, never on a database
  beforeEach(() => {
    vi.stubEnv('DB_MIGRATE_USER', '');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('refuses the demo before connecting when the database is not local', async () => {
    vi.stubEnv('ENVIRONMENT', 'development');
    vi.stubEnv('DB_TLS_MODE', 'verify');

    await expect(seedDatabase({ demo: true, fresh: false, environment: 'dev' })).rejects.toThrow(
      'The demo seed runs only against a local database'
    );
  });

  it('refuses --fresh before connecting on a deployed environment', async () => {
    vi.stubEnv('ENVIRONMENT', 'production');

    await expect(seedDatabase({ demo: false, fresh: true, environment: 'dev' })).rejects.toThrow(
      '--fresh is refused on a deployed environment (production)'
    );
  });
});
