import { randomUUID } from 'crypto';

import { eq } from 'drizzle-orm';
import { describe, it, expect, beforeEach, afterEach, afterAll } from 'vitest';

import {
  exerciseCompletions,
  programmes,
  userSessionExercises,
  userSessions,
  users,
  videos,
} from '@ffp/database/schema';

import {
  addMemberExerciseService,
  removeMemberExerciseService,
  reorderMemberExercisesService,
  reorderMemberSessionsService,
  updateMemberExerciseService,
} from '../../src/admin/admin-member-programme.service';
import { closePool, withRLS } from '../../src/lib/database';
import { NotFoundError } from '../../src/lib/errors';
import { findCurrentProgrammeInTx } from '../../src/programmes/programme.repository';
import { getFullProgrammeDetailForUser } from '../../src/programmes/programme.service';
import { lockUserSessionInProgramme } from '../../src/sessions/session.repository';
import { startSession } from '../../src/sessions/session.service';
import {
  createFixture,
  generateFor,
  memberContext,
  removeFixture,
  shortId,
  type Fixture,
} from '../programmes/programme-fixture';

import type { OrganisationContext } from '../../src/lib/context';
import type { AdminProgrammeDetailResponse } from '../../src/schemas/programme/programme.schema';

/** A system admin in an organisation of their own, so every fixture row is another one's */
const adminContext = (): OrganisationContext => ({
  actor: {
    type: 'user',
    userId: randomUUID(),
    userRole: 'system_admin',
  },
  organisationId: randomUUID(),
  locationId: null,
  requestId: randomUUID(),
  timestamp: new Date(),
});

type Detail = AdminProgrammeDetailResponse;

const LOCKED_WORDING = {
  in_progress: 'This session is under way',
  completed: 'This session is completed',
  skipped: 'This session was skipped',
} as const;
type DetailSession = Detail['phases'][number]['sessions'][number];

const sessionAt = (detail: Detail, phaseIndex: number, sessionIndex: number): DetailSession =>
  detail.phases[phaseIndex].sessions[sessionIndex];

const userSessionId = (session: DetailSession): string => session.userSession?.id ?? '';

const exerciseIds = (session: DetailSession): string[] =>
  (session.exercises ?? []).map((exercise) => exercise.sessionExerciseId);

describe('Admin edits of a member’s programme', () => {
  let fixture: Fixture;
  let foreign: Fixture;
  let activeVideoId: string;
  let draftVideoId: string;
  let memberPublicId: string;
  let otherPublicId: string;
  let foreignPublicId: string;

  const publicIdOf = async (organisationId: string, userId: string): Promise<string> =>
    await withRLS(organisationId, undefined, async (tx) => {
      const [row] = await tx
        .select({ publicId: users.publicId })
        .from(users)
        .where(eq(users.id, userId));

      return row.publicId;
    });

  const readMember = (): Promise<Detail> =>
    getFullProgrammeDetailForUser(fixture.organisationId, fixture.userId);
  const readOther = (): Promise<Detail> =>
    getFullProgrammeDetailForUser(fixture.organisationId, fixture.otherUserId);

  const setSessionStatus = async (
    sessionId: string,
    status: 'in_progress' | 'completed' | 'skipped'
  ): Promise<void> => {
    await withRLS(fixture.organisationId, undefined, (tx) =>
      tx.update(userSessions).set({ status }).where(eq(userSessions.id, sessionId))
    );
  };

  const sourceOf = async (exerciseId: string): Promise<string | null> => {
    const [row] = await withRLS(fixture.organisationId, undefined, (tx) =>
      tx
        .select({ source: userSessionExercises.sourceSessionExerciseId })
        .from(userSessionExercises)
        .where(eq(userSessionExercises.id, exerciseId))
    );

    return row.source;
  };

  beforeEach(async () => {
    fixture = await createFixture();
    foreign = await createFixture();

    activeVideoId = randomUUID();
    draftVideoId = randomUUID();
    await withRLS(fixture.organisationId, undefined, (tx) =>
      tx.insert(videos).values([
        {
          id: activeVideoId,
          title: 'Member edit video',
          s3Key: `tests/member-edit/${shortId()}.mp4`,
          durationSeconds: 60,
          fileSizeBytes: 1024,
          equipment: [],
          status: 'active',
          defaultSets: 4,
          defaultReps: '6',
          defaultDurationSeconds: 40,
          defaultRestSeconds: 20,
          defaultNotes: 'Default note',
        },
        {
          id: draftVideoId,
          title: 'Member edit draft video',
          s3Key: `tests/member-edit/${shortId()}.mp4`,
          durationSeconds: 60,
          fileSizeBytes: 1024,
          equipment: [],
        },
      ])
    );
    // removeFixture deletes the fixture's videos once the member rows pinning them are gone
    fixture.videoIds.push(activeVideoId, draftVideoId);

    await generateFor(fixture);
    await generateFor(fixture, fixture.otherUserId);
    await generateFor(foreign);

    memberPublicId = await publicIdOf(fixture.organisationId, fixture.userId);
    otherPublicId = await publicIdOf(fixture.organisationId, fixture.otherUserId);
    foreignPublicId = await publicIdOf(foreign.organisationId, foreign.userId);
  });

  afterEach(async () => {
    // The foreign member may hold a fixture video, so their rows go first
    await removeFixture(foreign);
    await removeFixture(fixture);
  });

  afterAll(async () => {
    await closePool();
  });

  describe('writes', () => {
    it('appends an exercise with the video’s defaults, and the given fields over them', async () => {
      const session = sessionAt(await readMember(), 0, 0);

      const added = await addMemberExerciseService(
        adminContext(),
        memberPublicId,
        userSessionId(session),
        { videoId: activeVideoId }
      );
      const tuned = await addMemberExerciseService(
        adminContext(),
        memberPublicId,
        userSessionId(session),
        { videoId: activeVideoId, sets: 2, notes: 'Slowly' }
      );

      const after = sessionAt(await readMember(), 0, 0);
      const [, , addedRow, tunedRow] = after.exercises ?? [];

      expect(after.exercises).toHaveLength(4);
      expect(addedRow).toMatchObject({
        sessionExerciseId: added.id,
        orderIndex: 2,
        sets: 4,
        reps: '6',
        durationSeconds: 40,
        restSeconds: 20,
        notes: 'Default note',
      });
      expect(tunedRow).toMatchObject({
        sessionExerciseId: tuned.id,
        orderIndex: 3,
        sets: 2,
        reps: '6',
        notes: 'Slowly',
      });
    });

    it('swaps an exercise’s video and changes its prescription', async () => {
      const [target] = sessionAt(await readMember(), 0, 0).exercises ?? [];

      await updateMemberExerciseService(adminContext(), memberPublicId, target.sessionExerciseId, {
        videoId: activeVideoId,
        sets: 5,
        reps: '12',
        durationSeconds: null,
        notes: null,
      });

      const [after] = sessionAt(await readMember(), 0, 0).exercises ?? [];

      expect(after).toMatchObject({
        sessionExerciseId: target.sessionExerciseId,
        orderIndex: 0,
        sets: 5,
        reps: '12',
        durationSeconds: null,
        notes: null,
      });
      expect(after.video.id).toBe(activeVideoId);
      expect(await sourceOf(target.sessionExerciseId)).toBeNull();
    });

    it('keeps the template link when only the prescription changes', async () => {
      const [target] = sessionAt(await readMember(), 0, 0).exercises ?? [];
      const source = await sourceOf(target.sessionExerciseId);

      await updateMemberExerciseService(adminContext(), memberPublicId, target.sessionExerciseId, {
        sets: 5,
      });

      expect(source).not.toBeNull();
      expect(await sourceOf(target.sessionExerciseId)).toBe(source);
    });

    it('removes an exercise and closes the gap in the order', async () => {
      const session = sessionAt(await readMember(), 0, 0);
      await addMemberExerciseService(adminContext(), memberPublicId, userSessionId(session), {
        videoId: activeVideoId,
      });
      const [, middle] = sessionAt(await readMember(), 0, 0).exercises ?? [];

      await removeMemberExerciseService(adminContext(), memberPublicId, middle.sessionExerciseId);

      const after = sessionAt(await readMember(), 0, 0).exercises ?? [];

      expect(after.map((exercise) => exercise.orderIndex)).toEqual([0, 1]);
      expect(after.map((exercise) => exercise.sessionExerciseId)).not.toContain(
        middle.sessionExerciseId
      );
    });

    it('reverses a session’s exercises across the unique order index', async () => {
      const session = sessionAt(await readMember(), 0, 0);
      const reversed = exerciseIds(session).reverse();

      await reorderMemberExercisesService(adminContext(), memberPublicId, userSessionId(session), {
        orderedIds: reversed,
      });

      const after = sessionAt(await readMember(), 0, 0);

      expect(exerciseIds(after)).toEqual(reversed);
      expect((after.exercises ?? []).map((exercise) => exercise.orderIndex)).toEqual([0, 1]);
    });

    it('swaps a phase’s sessions across the unique session number', async () => {
      const phase = (await readMember()).phases[0];
      const reversed = phase.sessions.map(userSessionId).reverse();

      await reorderMemberSessionsService(adminContext(), memberPublicId, phase.id, {
        orderedIds: reversed,
      });

      const after = (await readMember()).phases[0];

      expect(after.sessions.map(userSessionId)).toEqual(reversed);
      expect(after.sessions.map((session) => session.sessionNumber)).toEqual([1, 2]);
    });

    it('starts an edited session with completions for the edited exercises', async () => {
      const detail = await readMember();
      const phase = detail.phases[0];
      const session = sessionAt(detail, 0, 0);
      const [first] = session.exercises ?? [];

      await addMemberExerciseService(adminContext(), memberPublicId, userSessionId(session), {
        videoId: activeVideoId,
      });
      await removeMemberExerciseService(adminContext(), memberPublicId, first.sessionExerciseId);

      const edited = exerciseIds(sessionAt(await readMember(), 0, 0));

      await startSession(
        { programmePhaseId: phase.id, templateSessionId: session.templateSessionId },
        memberContext(fixture)
      );

      const completedIds = await withRLS(fixture.organisationId, fixture.userId, async (tx) =>
        (
          await tx
            .select({ id: exerciseCompletions.userSessionExerciseId })
            .from(exerciseCompletions)
            .where(eq(exerciseCompletions.userSessionId, userSessionId(session)))
        ).map((row) => row.id)
      );

      expect([...completedIds].sort()).toEqual([...edited].sort());
    });
  });

  it('holds a session start until an edit in flight commits, then copies the edited set', async () => {
    const detail = await readMember();
    const phase = detail.phases[0];
    const session = sessionAt(detail, 0, 0);
    let release = (): void => undefined;
    const released = new Promise<void>((resolve) => {
      release = resolve;
    });
    let signalLocked = (): void => undefined;
    const locked = new Promise<void>((resolve) => {
      signalLocked = resolve;
    });

    // An edit that takes the session lock, then waits before adding an exercise
    const edit = withRLS(fixture.organisationId, fixture.userId, async (tx) => {
      const programme = await findCurrentProgrammeInTx(tx, fixture.organisationId, fixture.userId);
      await lockUserSessionInProgramme(tx, programme?.id ?? '', userSessionId(session));
      signalLocked();
      await released;

      const [added] = await tx
        .insert(userSessionExercises)
        .values({
          organisationId: fixture.organisationId,
          userSessionId: userSessionId(session),
          videoId: activeVideoId,
          orderIndex: 2,
        })
        .returning();

      return added.id;
    });

    await locked;
    let startSettled = false;
    const start = startSession(
      { programmePhaseId: phase.id, templateSessionId: session.templateSessionId },
      memberContext(fixture)
    ).finally(() => {
      startSettled = true;
    });

    await new Promise((resolve) => setTimeout(resolve, 300));
    expect(startSettled).toBe(false);

    release();
    const addedId = await edit;
    const started = await start;

    expect(
      started.exerciseCompletions.map((completion) => completion.userSessionExerciseId)
    ).toContain(addedId);
  });

  describe('isolation', () => {
    it('leaves another member on the same template untouched', async () => {
      const otherBefore = await readOther();
      const detail = await readMember();
      const session = sessionAt(detail, 0, 0);
      const [first] = session.exercises ?? [];

      await addMemberExerciseService(adminContext(), memberPublicId, userSessionId(session), {
        videoId: activeVideoId,
      });
      await updateMemberExerciseService(adminContext(), memberPublicId, first.sessionExerciseId, {
        sets: 9,
        notes: 'Only for this member',
      });
      await reorderMemberExercisesService(adminContext(), memberPublicId, userSessionId(session), {
        orderedIds: exerciseIds(sessionAt(await readMember(), 0, 0)).reverse(),
      });
      await removeMemberExerciseService(adminContext(), memberPublicId, first.sessionExerciseId);
      await reorderMemberSessionsService(adminContext(), memberPublicId, detail.phases[0].id, {
        orderedIds: detail.phases[0].sessions.map(userSessionId).reverse(),
      });

      expect(await readOther()).toEqual(otherBefore);
    });

    it('refuses another member’s ids on this member’s routes, in the same organisation', async () => {
      const otherBefore = await readOther();
      const otherDetail = otherBefore;
      const otherSession = sessionAt(otherDetail, 0, 0);
      const [otherExercise] = otherSession.exercises ?? [];

      await expect(
        addMemberExerciseService(adminContext(), memberPublicId, userSessionId(otherSession), {
          videoId: activeVideoId,
        })
      ).rejects.toBeInstanceOf(NotFoundError);
      await expect(
        updateMemberExerciseService(
          adminContext(),
          memberPublicId,
          otherExercise.sessionExerciseId,
          { sets: 9 }
        )
      ).rejects.toBeInstanceOf(NotFoundError);
      await expect(
        removeMemberExerciseService(adminContext(), memberPublicId, otherExercise.sessionExerciseId)
      ).rejects.toBeInstanceOf(NotFoundError);
      await expect(
        reorderMemberExercisesService(adminContext(), memberPublicId, userSessionId(otherSession), {
          orderedIds: exerciseIds(otherSession).reverse(),
        })
      ).rejects.toBeInstanceOf(NotFoundError);
      await expect(
        reorderMemberSessionsService(adminContext(), memberPublicId, otherDetail.phases[0].id, {
          orderedIds: otherDetail.phases[0].sessions.map(userSessionId).reverse(),
        })
      ).rejects.toBeInstanceOf(NotFoundError);

      expect(await readOther()).toEqual(otherBefore);
    });

    it('writes another organisation’s member under that organisation', async () => {
      const detail = await getFullProgrammeDetailForUser(foreign.organisationId, foreign.userId);
      const session = sessionAt(detail, 0, 0);

      const added = await addMemberExerciseService(
        adminContext(),
        foreignPublicId,
        userSessionId(session),
        { videoId: activeVideoId }
      );

      const [row] = await withRLS(foreign.organisationId, undefined, (tx) =>
        tx
          .select({ organisationId: userSessionExercises.organisationId })
          .from(userSessionExercises)
          .where(eq(userSessionExercises.id, added.id))
      );

      expect(row.organisationId).toBe(foreign.organisationId);
    });
  });

  describe('refusals', () => {
    it.each(['in_progress', 'completed', 'skipped'] as const)(
      'refuses every exercise edit on a %s session, writing nothing',
      async (status) => {
        const session = sessionAt(await readMember(), 0, 0);
        const [first] = session.exercises ?? [];
        await setSessionStatus(userSessionId(session), status);
        const before = await readMember();
        const locked = {
          statusCode: 409,
          message: `${LOCKED_WORDING[status]}, so it can no longer be changed.`,
        };

        await expect(
          addMemberExerciseService(adminContext(), memberPublicId, userSessionId(session), {
            videoId: activeVideoId,
          })
        ).rejects.toMatchObject(locked);
        await expect(
          updateMemberExerciseService(adminContext(), memberPublicId, first.sessionExerciseId, {
            sets: 9,
          })
        ).rejects.toMatchObject(locked);
        await expect(
          removeMemberExerciseService(adminContext(), memberPublicId, first.sessionExerciseId)
        ).rejects.toMatchObject(locked);
        await expect(
          reorderMemberExercisesService(adminContext(), memberPublicId, userSessionId(session), {
            orderedIds: exerciseIds(session).reverse(),
          })
        ).rejects.toMatchObject(locked);

        expect(await readMember()).toEqual(before);
      }
    );

    it('refuses to remove a session’s last exercise', async () => {
      const session = sessionAt(await readMember(), 0, 1);
      const [only] = session.exercises ?? [];

      expect(session.exercises).toHaveLength(1);
      await expect(
        removeMemberExerciseService(adminContext(), memberPublicId, only.sessionExerciseId)
      ).rejects.toMatchObject({
        statusCode: 409,
        message: "A session needs at least one exercise, so its last one can't be removed.",
      });
      expect(exerciseIds(sessionAt(await readMember(), 0, 1))).toEqual([only.sessionExerciseId]);
    });

    it('refuses a video that is not active, or does not exist', async () => {
      const session = sessionAt(await readMember(), 0, 0);
      const [first] = session.exercises ?? [];

      await expect(
        addMemberExerciseService(adminContext(), memberPublicId, userSessionId(session), {
          videoId: draftVideoId,
        })
      ).rejects.toMatchObject({ statusCode: 400, message: 'Video is not active' });
      await expect(
        updateMemberExerciseService(adminContext(), memberPublicId, first.sessionExerciseId, {
          videoId: randomUUID(),
        })
      ).rejects.toMatchObject({ statusCode: 400, message: 'Video not found' });
      expect(exerciseIds(sessionAt(await readMember(), 0, 0))).toEqual(exerciseIds(session));
    });

    it('refuses duplicate or partial reorder ids', async () => {
      const detail = await readMember();
      const session = sessionAt(detail, 0, 0);
      const [first] = exerciseIds(session);
      const phase = detail.phases[0];

      await expect(
        reorderMemberExercisesService(adminContext(), memberPublicId, userSessionId(session), {
          orderedIds: [first, first],
        })
      ).rejects.toMatchObject({ statusCode: 400, message: 'Exercise IDs must be unique' });
      await expect(
        reorderMemberExercisesService(adminContext(), memberPublicId, userSessionId(session), {
          orderedIds: [first],
        })
      ).rejects.toMatchObject({
        statusCode: 400,
        message: 'Expected 2 exercise IDs but received 1',
      });
      await expect(
        reorderMemberSessionsService(adminContext(), memberPublicId, phase.id, {
          orderedIds: [userSessionId(phase.sessions[0])],
        })
      ).rejects.toMatchObject({
        statusCode: 400,
        message: 'Expected 2 session IDs but received 1',
      });
    });

    it('keeps a started session in its place while not-started ones move among themselves', async () => {
      // A third session, so two not-started ones can swap after a started first one
      const phase = (await readMember()).phases[0];
      const [started, second] = phase.sessions;
      await withRLS(fixture.organisationId, undefined, (tx) =>
        tx.insert(userSessions).values({
          organisationId: fixture.organisationId,
          programmePhaseId: phase.id,
          templateSessionId: second.templateSessionId,
          sessionNumber: 3,
        })
      );
      await setSessionStatus(userSessionId(started), 'completed');
      const ordered = (await readMember()).phases[0].sessions.map(userSessionId);

      await expect(
        reorderMemberSessionsService(adminContext(), memberPublicId, phase.id, {
          orderedIds: [ordered[1], ordered[0], ordered[2]],
        })
      ).rejects.toMatchObject({
        statusCode: 409,
        message:
          'Only sessions that have not started yet can be moved; the others keep their place.',
      });
      expect((await readMember()).phases[0].sessions.map(userSessionId)).toEqual(ordered);

      await reorderMemberSessionsService(adminContext(), memberPublicId, phase.id, {
        orderedIds: [ordered[0], ordered[2], ordered[1]],
      });

      expect((await readMember()).phases[0].sessions.map(userSessionId)).toEqual([
        ordered[0],
        ordered[2],
        ordered[1],
      ]);
    });

    it('refuses an unknown member, and a member without a current programme', async () => {
      const session = sessionAt(await readMember(), 0, 0);

      await expect(
        addMemberExerciseService(adminContext(), 'nobody000000', userSessionId(session), {
          videoId: activeVideoId,
        })
      ).rejects.toBeInstanceOf(NotFoundError);

      const otherSession = sessionAt(await readOther(), 0, 0);
      await withRLS(fixture.organisationId, undefined, (tx) =>
        tx
          .update(programmes)
          .set({ status: 'archived' })
          .where(eq(programmes.userId, fixture.otherUserId))
      );

      await expect(
        addMemberExerciseService(adminContext(), otherPublicId, userSessionId(otherSession), {
          videoId: activeVideoId,
        })
      ).rejects.toBeInstanceOf(NotFoundError);
    });
  });
});
