import { describe, expect, it } from 'vitest';

import { recordingDb } from '../testing';

import { applyRLS } from './apply-rls';

const RLS_TABLES = [
  'organisations',
  'locations',
  'users',
  'user_assessments',
  'user_assessment_answers',
  'assessment_safety_triggers',
  'programmes',
  'programme_phases',
  'user_sessions',
  'user_session_exercises',
  'exercise_completions',
];

const forceStatements = async (env: NodeJS.ProcessEnv): Promise<string[]> => {
  const { db, statements } = recordingDb();

  await applyRLS(db, env);

  return statements
    .map(({ text }) => text)
    .filter((text) => text.includes('FORCE ROW LEVEL SECURITY'))
    .sort();
};

const expected = (mode: string): string[] =>
  RLS_TABLES.map((table) => `ALTER TABLE ${table} ${mode} ROW LEVEL SECURITY`).sort();

describe('applyRLS force mode', () => {
  it.each(['production', 'production-like'])(
    'leaves the owner exempt on the deployed %s profile, on every RLS table',
    async (environment) => {
      expect(await forceStatements({ ENVIRONMENT: environment })).toEqual(expected('NO FORCE'));
    }
  );

  it.each([
    ['development', { ENVIRONMENT: 'development' }],
    ['test', { ENVIRONMENT: 'test' }],
    ['unset', {}],
    ['empty', { ENVIRONMENT: '' }],
    ['the retired prod alias', { ENVIRONMENT: 'prod' }],
  ])('forces RLS on every RLS table when ENVIRONMENT is %s', async (_label, env) => {
    expect(await forceStatements(env)).toEqual(expected('FORCE'));
  });
});
