import { asc, eq, inArray } from 'drizzle-orm';
import { afterAll, afterEach, beforeEach, describe, expect, it } from 'vitest';

import {
  sessionExercises,
  templatePhases,
  templateSessions,
  type SessionExerciseRecord,
  type TemplatePhaseRecord,
  type TemplateSessionRecord,
} from '@ffp/database/schema';

import { closePool, withRLS } from '../../src/lib/database';
import { ConflictError, ValidationError } from '../../src/lib/errors';
import { reorderExercises } from '../../src/programme-templates/session-exercise.service';
import { deletePhase, reorderPhases } from '../../src/programme-templates/template-phase.service';
import {
  deleteSession,
  reorderSessions,
} from '../../src/programme-templates/template-session.service';

import { createFixture, generateFor, removeFixture, type Fixture } from './programme-fixture';

interface Hierarchy {
  phases: TemplatePhaseRecord[];
  sessions: TemplateSessionRecord[];
  exercises: SessionExerciseRecord[];
}

/** The fixture template's rows, in their stored order */
const readHierarchy = (fixture: Fixture): Promise<Hierarchy> =>
  withRLS(fixture.organisationId, undefined, async (tx) => {
    const phases = await tx
      .select()
      .from(templatePhases)
      .where(eq(templatePhases.programmeTemplateId, fixture.templateId))
      .orderBy(asc(templatePhases.phaseNumber));
    const phaseIds = phases.map((phase) => phase.id);
    const sessions = await tx
      .select()
      .from(templateSessions)
      .where(inArray(templateSessions.templatePhaseId, phaseIds))
      .orderBy(asc(templateSessions.templatePhaseId), asc(templateSessions.sessionNumber));
    const exercises = await tx
      .select()
      .from(sessionExercises)
      .where(
        inArray(
          sessionExercises.templateSessionId,
          sessions.map((session) => session.id)
        )
      )
      .orderBy(asc(sessionExercises.templateSessionId), asc(sessionExercises.orderIndex));

    return { phases, sessions, exercises };
  });

const sessionsOf = (hierarchy: Hierarchy, phase: TemplatePhaseRecord): TemplateSessionRecord[] =>
  hierarchy.sessions.filter((session) => session.templatePhaseId === phase.id);

describe('Template hierarchy writes', () => {
  let fixture: Fixture;

  beforeEach(async () => {
    fixture = await createFixture();
  });

  afterEach(async () => {
    await removeFixture(fixture);
  });

  afterAll(async () => {
    await closePool();
  });

  describe('reorder with a duplicate id', () => {
    it('refuses phases with a 400 and leaves the order alone', async () => {
      const before = await readHierarchy(fixture);
      const [first] = before.phases;

      await expect(
        reorderPhases(fixture.templateId, { orderedIds: [first.id, first.id] })
      ).rejects.toBeInstanceOf(ValidationError);

      expect((await readHierarchy(fixture)).phases).toEqual(before.phases);
    });

    it('refuses sessions with a 400 and leaves the order alone', async () => {
      const before = await readHierarchy(fixture);
      const [first] = sessionsOf(before, before.phases[0]);

      await expect(
        reorderSessions(before.phases[0].id, { orderedIds: [first.id, first.id] })
      ).rejects.toBeInstanceOf(ValidationError);

      expect((await readHierarchy(fixture)).sessions).toEqual(before.sessions);
    });

    it('refuses exercises with a 400 and leaves the order alone', async () => {
      const before = await readHierarchy(fixture);
      const session = sessionsOf(before, before.phases[0])[0];
      const [first] = before.exercises.filter(
        (exercise) => exercise.templateSessionId === session.id
      );

      await expect(
        reorderExercises(session.id, { orderedIds: [first.id, first.id] })
      ).rejects.toBeInstanceOf(ValidationError);

      expect((await readHierarchy(fixture)).exercises).toEqual(before.exercises);
    });
  });

  describe('deleting what members hold', () => {
    it('deletes a session nobody holds', async () => {
      const before = await readHierarchy(fixture);
      const [first, second] = sessionsOf(before, before.phases[0]);

      await deleteSession(first.id);

      const after = await readHierarchy(fixture);
      const remaining = sessionsOf(after, after.phases[0]);

      expect(remaining.map((session) => session.id)).toEqual([second.id]);
      expect(remaining[0].sessionNumber).toBe(1);
    });

    it('refuses a session a member holds with a 409 and deletes nothing', async () => {
      await generateFor(fixture);
      const before = await readHierarchy(fixture);
      const [first] = sessionsOf(before, before.phases[0]);

      const refusal = deleteSession(first.id);

      await expect(refusal).rejects.toBeInstanceOf(ConflictError);
      await expect(refusal).rejects.toThrow("This session is part of members' programmes");
      expect(await readHierarchy(fixture)).toEqual(before);
    });

    it('deletes a phase nobody holds', async () => {
      const before = await readHierarchy(fixture);
      const [first, second] = before.phases;

      await deletePhase(first.id);

      const after = await readHierarchy(fixture);

      expect(after.phases.map((phase) => phase.id)).toEqual([second.id]);
      expect(after.phases[0].phaseNumber).toBe(1);
    });

    it('refuses a phase a member holds with a 409 and deletes nothing', async () => {
      await generateFor(fixture);
      const before = await readHierarchy(fixture);

      const refusal = deletePhase(before.phases[0].id);

      await expect(refusal).rejects.toBeInstanceOf(ConflictError);
      await expect(refusal).rejects.toThrow("This phase is part of members' programmes");
      expect(await readHierarchy(fixture)).toEqual(before);
    });
  });
});
