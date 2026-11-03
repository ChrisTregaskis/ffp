import { describe, expect, it } from 'vitest';

import { migrationCredentials } from './migration-credentials';

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
