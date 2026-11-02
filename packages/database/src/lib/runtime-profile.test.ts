import { describe, expect, it } from 'vitest';

import { runtimeProfileForStage } from './runtime-profile';

const PRODUCTION_LIKE = {
  ENVIRONMENT: 'production-like',
  NODE_ENV: 'production',
  LOG_LEVEL: 'INFO',
  DB_TLS_MODE: 'verify',
};

describe('runtimeProfileForStage', () => {
  it('runs production as production, verifying TLS and logging at INFO', () => {
    expect(runtimeProfileForStage('production', false)).toEqual({
      ENVIRONMENT: 'production',
      NODE_ENV: 'production',
      LOG_LEVEL: 'INFO',
      DB_TLS_MODE: 'verify',
    });
  });

  it('runs the pre-release stage like production under its own name', () => {
    expect(runtimeProfileForStage('prerelease', false)).toEqual(PRODUCTION_LIKE);
  });

  it('runs a personal stage under sst dev as local development', () => {
    expect(runtimeProfileForStage('christophertregaskis', true)).toEqual({
      ENVIRONMENT: 'development',
      NODE_ENV: 'development',
      LOG_LEVEL: 'DEBUG',
      DB_TLS_MODE: 'local',
    });
  });

  it.each(['staging', 'dev', 'Production', 'christophertregaskis'])(
    'verifies TLS on any other deployed stage (%s) rather than assuming development',
    (stage) => {
      expect(runtimeProfileForStage(stage, false)).toEqual(PRODUCTION_LIKE);
    }
  );

  it('keeps production and prerelease production-grade even under sst dev', () => {
    expect(runtimeProfileForStage('production', true).DB_TLS_MODE).toBe('verify');
    expect(runtimeProfileForStage('prerelease', true)).toEqual(PRODUCTION_LIKE);
  });
});
