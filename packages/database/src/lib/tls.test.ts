import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join, resolve } from 'path';

import { afterEach, describe, expect, it } from 'vitest';

import { dbTlsConfig } from './tls';

const RDS_CA_BUNDLE = readFileSync(resolve(__dirname, '../../certs/rds-ca-bundle.pem'), 'utf-8');

describe('dbTlsConfig', () => {
  const tempDirs: string[] = [];

  const taskRoot = (bundle?: string): string => {
    const dir = mkdtempSync(join(tmpdir(), 'ffp-tls-'));
    tempDirs.push(dir);
    if (bundle !== undefined) {
      mkdirSync(join(dir, 'certs'));
      writeFileSync(join(dir, 'certs/rds-ca-bundle.pem'), bundle);
    }
    return dir;
  };

  afterEach(() => {
    tempDirs.splice(0).forEach((dir) => {
      rmSync(dir, { recursive: true, force: true });
    });
  });

  it('turns TLS off only for a connection marked local', () => {
    expect(dbTlsConfig({ DB_TLS_MODE: 'local' })).toBe(false);
  });

  it.each([
    ['unset', {}],
    ['empty', { DB_TLS_MODE: '' }],
    ['verify', { DB_TLS_MODE: 'verify' }],
  ])('verifies against the pinned RDS CA when the mode is %s', (_label, env) => {
    expect(dbTlsConfig(env)).toEqual({ rejectUnauthorized: true, ca: RDS_CA_BUNDLE });
  });

  it('refuses a mode it does not recognise rather than guessing', () => {
    expect(() => dbTlsConfig({ DB_TLS_MODE: 'off' })).toThrow(
      'DB_TLS_MODE must be one of verify, local, got "off"'
    );
  });

  it('reads the bundle from the deployed package root on a function', () => {
    const root = taskRoot('-----TASK ROOT BUNDLE-----');

    expect(dbTlsConfig({ LAMBDA_TASK_ROOT: root })).toEqual({
      rejectUnauthorized: true,
      ca: '-----TASK ROOT BUNDLE-----',
    });
  });

  it('fails rather than connecting unverified when the bundle is missing', () => {
    const root = taskRoot();

    expect(() => dbTlsConfig({ LAMBDA_TASK_ROOT: root })).toThrow(/ENOENT.*rds-ca-bundle\.pem/);
  });
});
