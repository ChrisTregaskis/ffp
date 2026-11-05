import { describe, expect, it } from 'vitest';

import { migrationCredentials, migratorConnection } from './migration-credentials';

describe('migrationCredentials', () => {
  it("connects as the migration role with that role's own password", () => {
    expect(
      migrationCredentials({
        DB_MIGRATE_USER: 'migrator',
        DB_MIGRATE_PASSWORD: 'migrator-secret',
        DB_USER: 'app_user',
        DB_PASSWORD: 'app-secret',
      })
    ).toEqual({ user: 'migrator', password: 'migrator-secret' });
  });

  it("never falls back to the runtime role's password", () => {
    expect(() =>
      migrationCredentials({
        DB_MIGRATE_USER: 'migrator',
        DB_USER: 'app_user',
        DB_PASSWORD: 'app-secret',
      })
    ).toThrow('DB_MIGRATE_PASSWORD is required with DB_MIGRATE_USER');
  });

  it('treats an empty migrate password as missing', () => {
    expect(() =>
      migrationCredentials({ DB_MIGRATE_USER: 'migrator', DB_MIGRATE_PASSWORD: '' })
    ).toThrow('DB_MIGRATE_PASSWORD is required with DB_MIGRATE_USER');
  });

  it('never falls back to migrating as the runtime role', () => {
    expect(() =>
      migrationCredentials({ DB_USER: 'app_user', DB_PASSWORD: 'app-secret' })
    ).toThrow('DB_MIGRATE_USER is required');
  });
});

describe('migratorConnection', () => {
  const env = {
    DB_HOST: 'db.internal',
    DB_PORT: '6543',
    DB_NAME: 'ffp',
    DB_MIGRATE_USER: 'migrator',
    DB_MIGRATE_PASSWORD: 'migrator-secret',
    DB_USER: 'app_user',
    DB_PASSWORD: 'app-secret',
  };

  it('connects as the migration role, never the runtime role', () => {
    expect(migratorConnection({ ...env, DB_TLS_MODE: 'local' })).toEqual({
      host: 'db.internal',
      port: 6543,
      database: 'ffp',
      user: 'migrator',
      password: 'migrator-secret',
      ssl: false,
    });
  });

  it('verifies TLS unless the connection is marked local', () => {
    expect(migratorConnection(env).ssl).toMatchObject({ rejectUnauthorized: true });
  });
});
