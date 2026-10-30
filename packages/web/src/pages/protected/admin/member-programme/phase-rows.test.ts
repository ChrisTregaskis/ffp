import { describe, expect, it } from 'vitest';

import { session } from '@web/components/programme/programme-test-fixture';

import { toMemberPhaseRow } from './phase-rows';
import { memberProgramme } from './programme-fixture';

describe('toMemberPhaseRow', () => {
  it('counts skipped sessions as done', () => {
    const programme = memberProgramme({}, [
      session(1, 'completed', []),
      session(2, 'skipped', []),
      session(3, 'not_started', []),
    ]);

    expect(toMemberPhaseRow(programme.phases[1])).toMatchObject({
      sessionsDone: 2,
      sessionCount: 3,
    });
  });
});
