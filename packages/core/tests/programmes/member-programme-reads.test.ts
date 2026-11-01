import { randomUUID } from 'crypto';

import { asc, eq } from 'drizzle-orm';
import { describe, it, expect, beforeEach, afterEach, afterAll } from 'vitest';

import {
  assessmentFlows,
  programmes,
  sessionExercises,
  templatePhases,
  templateSessions,
  userAssessments,
  userSessionExercises,
} from '@ffp/database/schema';

import { toggleExerciseCompletion } from '../../src/exercises/exercise.service';
import { closePool, withRLS } from '../../src/lib/database';
import { NotFoundError } from '../../src/lib/errors';
import {
  getProgrammeDetail,
  getProgressSummary,
  replaceProgramme,
} from '../../src/programmes/programme.service';
import { startSession } from '../../src/sessions/session.service';

import {
  createFixture,
  generateFor,
  memberContext,
  removeFixture,
  shortId,
  type Fixture,
} from './programme-fixture';

describe('Member programme reads', () => {
  let fixture: Fixture;
  let flowId: string | null;

  beforeEach(async () => {
    fixture = await createFixture();
    flowId = null;
  });

  afterEach(async () => {
    await removeFixture(fixture);

    if (flowId) {
      await withRLS(fixture.organisationId, undefined, (tx) =>
        tx.delete(assessmentFlows).where(eq(assessmentFlows.id, flowId ?? ''))
      );
    }
  });

  afterAll(async () => {
    await closePool();
  });

  /** Generate, then start the first session so the current phase carries completions. */
  const generateAndStart = async (): Promise<void> => {
    await generateFor(fixture);

    const detail = await getProgrammeDetail(memberContext(fixture));
    const [firstPhase] = detail.phases;

    await startSession(
      {
        programmePhaseId: firstPhase.id,
        templateSessionId: firstPhase.sessions[0].templateSessionId,
      },
      memberContext(fixture)
    );
  };

  it('resolves completions against the member’s own exercises', async () => {
    await generateAndStart();

    const detail = await getProgrammeDetail(memberContext(fixture));
    const session = detail.phases[0].sessions[0];
    const exercises = session.exercises ?? [];

    const memberExerciseIds = await withRLS(fixture.organisationId, fixture.userId, async (tx) =>
      (
        await tx
          .select({ id: userSessionExercises.id })
          .from(userSessionExercises)
          .where(eq(userSessionExercises.userSessionId, session.userSession?.id ?? ''))
          .orderBy(asc(userSessionExercises.orderIndex))
      ).map((row) => row.id)
    );

    expect(exercises.map((exercise) => exercise.sessionExerciseId)).toEqual(memberExerciseIds);
    expect(exercises.every((exercise) => exercise.completion !== null)).toBe(true);

    await toggleExerciseCompletion(exercises[0].completion?.id ?? '', true, memberContext(fixture));

    const after = await getProgrammeDetail(memberContext(fixture));
    const progress = await getProgressSummary(memberContext(fixture));

    expect(after.phases[0].sessions[0].exercises?.[0].completion?.completed).toBe(true);
    expect(progress.completedExercises).toBe(1);
  });

  it('shows an existing member the same programme after the template is edited', async () => {
    await generateAndStart();

    const detailBefore = await getProgrammeDetail(memberContext(fixture));
    const progressBefore = await getProgressSummary(memberContext(fixture));

    await withRLS(fixture.organisationId, undefined, async (tx) => {
      const phases = await tx
        .select()
        .from(templatePhases)
        .where(eq(templatePhases.programmeTemplateId, fixture.templateId))
        .orderBy(asc(templatePhases.phaseNumber));
      const [firstSession, secondSession] = await tx
        .select()
        .from(templateSessions)
        .where(eq(templateSessions.templatePhaseId, phases[0].id))
        .orderBy(asc(templateSessions.sessionNumber));
      const [firstExercise, secondExercise] = await tx
        .select()
        .from(sessionExercises)
        .where(eq(sessionExercises.templateSessionId, firstSession.id))
        .orderBy(asc(sessionExercises.orderIndex));

      await tx
        .update(sessionExercises)
        .set({ sets: 9, reps: '99', notes: 'Edited after the programme was created' })
        .where(eq(sessionExercises.id, firstExercise.id));
      await tx.delete(sessionExercises).where(eq(sessionExercises.id, secondExercise.id));
      // Two in, one out, so a total read from the template would move
      await tx.insert(sessionExercises).values([
        { templateSessionId: secondSession.id, videoId: fixture.videoIds[1], orderIndex: 5 },
        { templateSessionId: secondSession.id, videoId: fixture.videoIds[0], orderIndex: 6 },
      ]);

      const [addedSession] = await tx
        .insert(templateSessions)
        .values({ templatePhaseId: phases[0].id, sessionNumber: 3 })
        .returning();
      await tx.insert(sessionExercises).values({
        templateSessionId: addedSession.id,
        videoId: fixture.videoIds[0],
        orderIndex: 0,
      });
    });

    const detailAfter = await getProgrammeDetail(memberContext(fixture));
    const progressAfter = await getProgressSummary(memberContext(fixture));

    expect(detailAfter).toEqual(detailBefore);
    expect(progressAfter).toEqual(progressBefore);
  });

  it('answers 404 when replacing from another member’s assessment', async () => {
    const programmeId = await generateFor(fixture);
    const assessmentId = randomUUID();
    flowId = randomUUID();

    await withRLS(fixture.organisationId, undefined, async (tx) => {
      await tx.insert(assessmentFlows).values({
        id: flowId ?? '',
        name: `Replacement flow ${shortId()}`,
        isActive: true,
      });
      await tx.insert(userAssessments).values({
        id: assessmentId,
        organisationId: fixture.organisationId,
        userId: fixture.otherUserId,
        flowId: flowId ?? '',
        status: 'scored',
        scores: {
          dimensions: [],
          recommendedTemplateSlug: fixture.templateSlug,
          scoredAt: new Date(),
        },
      });
    });

    await expect(replaceProgramme({ assessmentId }, memberContext(fixture))).rejects.toBeInstanceOf(
      NotFoundError
    );

    const memberProgrammes = await withRLS(fixture.organisationId, fixture.userId, (tx) =>
      tx.select().from(programmes).where(eq(programmes.userId, fixture.userId))
    );

    expect(memberProgrammes.map((programme) => [programme.id, programme.status])).toEqual([
      [programmeId, 'active'],
    ]);
  });
});
