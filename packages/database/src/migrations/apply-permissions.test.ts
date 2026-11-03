import { describe, expect, it } from 'vitest';

import { recordingDb, type RecordedStatement } from '../testing';

import { applyPermissions, resolveGrantees } from './apply-permissions';

const roleLookup =
  (inheritsOwner: boolean) =>
  ({ text }: RecordedStatement): Record<string, unknown>[] =>
    text.startsWith('SELECT pg_has_role') ? [{ inherits_owner: inheritsOwner }] : [];

const roleExists = roleLookup(false);

describe('resolveGrantees', () => {
  it('grants to the runtime role alone unless a test role is asked for', () => {
    expect(resolveGrantees('migrator', { DB_USER: 'app_user', ENVIRONMENT: 'development' })).toEqual(
      ['app_user']
    );
  });

  it('adds the test role where tests run when DB_TEST_USER names it', () => {
    expect(
      resolveGrantees('migrator', {
        DB_USER: 'app_user',
        DB_TEST_USER: 'test_user',
        ENVIRONMENT: 'development',
      })
    ).toEqual(['app_user', 'test_user']);
  });

  it.each(['production', 'production-like'])(
    'refuses a test role on the deployed %s profile',
    (environment) => {
      expect(() =>
        resolveGrantees('migrator', {
          DB_USER: 'app_user',
          DB_TEST_USER: 'test_user',
          ENVIRONMENT: environment,
        })
      ).toThrow(`DB_TEST_USER is not allowed when ENVIRONMENT is "${environment}"`);
    }
  );

  it('refuses to run without a runtime role', () => {
    expect(() => resolveGrantees('migrator', { ENVIRONMENT: 'development' })).toThrow(
      'DB_USER (the runtime role) is required'
    );
  });

  it('refuses a runtime role that is also the migration role', () => {
    expect(() => resolveGrantees('migrator', { DB_USER: 'migrator' })).toThrow(
      'The runtime role must not be the migration role ("migrator")'
    );
  });
});

describe('applyPermissions', () => {
  it('grants row access without TRUNCATE and revokes TRUNCATE, now and for future tables', async () => {
    const { db, statements } = recordingDb(roleExists);

    await applyPermissions(db, 'migrator', ['app_user']);

    expect(statements.map(({ text }) => text)).toEqual([
      'SELECT pg_has_role(rolname, $1, \'USAGE\') AS inherits_owner FROM pg_roles WHERE rolname = $2',
      'GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO "app_user"',
      'REVOKE TRUNCATE ON ALL TABLES IN SCHEMA public FROM "app_user"',
      'GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO "app_user"',
      'ALTER DEFAULT PRIVILEGES FOR ROLE "migrator" IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO "app_user"',
      'ALTER DEFAULT PRIVILEGES FOR ROLE "migrator" IN SCHEMA public REVOKE TRUNCATE ON TABLES FROM "app_user"',
      'ALTER DEFAULT PRIVILEGES FOR ROLE "migrator" IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO "app_user"',
    ]);
    expect(statements[0].params).toEqual(['migrator', 'app_user']);
  });

  it('fails, granting nothing, when a role does not exist', async () => {
    const { db, statements } = recordingDb();

    await expect(applyPermissions(db, 'migrator', ['app_user'])).rejects.toThrow(
      'Role "app_user" does not exist; create it before migrating'
    );
    expect(statements.filter(({ text }) => /^(GRANT|REVOKE|ALTER)/.test(text))).toEqual([]);
  });

  it('fails, granting nothing, when a role inherits the migration role', async () => {
    const { db, statements } = recordingDb(roleLookup(true));

    await expect(applyPermissions(db, 'migrator', ['app_user'])).rejects.toThrow(
      'Role "app_user" inherits the migration role "migrator"'
    );
    expect(statements.filter(({ text }) => /^(GRANT|REVOKE|ALTER)/.test(text))).toEqual([]);
  });

  it('fails the run when a grant fails', async () => {
    const { db } = recordingDb((statement) => {
      if (statement.text.startsWith('GRANT USAGE, SELECT ON ALL SEQUENCES')) {
        throw new Error('permission denied for sequence users_id_seq');
      }

      return roleExists(statement);
    });

    await expect(applyPermissions(db, 'migrator', ['app_user'])).rejects.toThrow(
      'permission denied for sequence users_id_seq'
    );
  });
});
