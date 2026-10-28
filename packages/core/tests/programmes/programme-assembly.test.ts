import { randomUUID } from 'crypto';

import { and, asc, eq, inArray } from 'drizzle-orm';
import { afterAll, afterEach, beforeEach, describe, expect, it } from 'vitest';

import {
  assessmentFlows,
  processJobs,
  programmePhases,
  programmes,
  questions,
  tagCategories,
  tags,
  templatePhases,
  templateSessionSlots,
  templateSessions,
  templateSlotTags,
  userAssessmentAnswers,
  userAssessments,
  userSessionExercises,
  userSessions,
  videos,
  videoTags,
  type UserSessionExerciseRecord,
  type VideoRecord,
} from '@ffp/database/schema';

import { processGenerateProgramme } from '../../src/jobs/handlers/generate-programme.handler';
import { failJob } from '../../src/jobs/job-processor.service';
import { hasProgrammeGenerationFailed } from '../../src/jobs/job-queue.service';
import { closePool, withRLS } from '../../src/lib/database';
import { ProgrammeAssemblyError } from '../../src/lib/errors';
import { generateProgramme } from '../../src/programmes/programme.service';

import {
  createFixture,
  generateFor,
  removeFixture,
  shortId,
  type Fixture,
} from './programme-fixture';

import type { Transaction } from '../../src/lib/database';

const POOL_SIZE = 4;

interface SlotData {
  /** Phase 1, session 1: the one session given slots */
  slottedSessionId: string;
  poolTagId: string;
  emptyTagId: string;
  pool: VideoRecord[];
  /** Created by a test that needs more than the shared data; removed with it */
  extraTagIds: string[];
  flowId?: string;
  questionId?: string;
}

/** A tag with four active videos, the first with every default set, and an empty tag. */
async function addSlotData(fixture: Fixture): Promise<SlotData> {
  return await withRLS(fixture.organisationId, undefined, async (tx) => {
    const [movement] = await tx
      .select({ id: tagCategories.id })
      .from(tagCategories)
      .where(eq(tagCategories.slug, 'movement'));
    const [poolTag, emptyTag] = await tx
      .insert(tags)
      .values(
        [shortId(), shortId()].map((id) => ({
          categoryId: movement.id,
          slug: `assembly-${id}`,
          label: `Assembly ${id}`,
        }))
      )
      .returning();

    const pool = await tx
      .insert(videos)
      .values(
        Array.from({ length: POOL_SIZE }, (_, index) => ({
          title: `Assembly video ${String(index)}`,
          s3Key: `tests/assembly/${randomUUID()}.mp4`,
          durationSeconds: 60,
          fileSizeBytes: 1024,
          equipment: [],
          status: 'active' as const,
          ...(index === 0 && {
            defaultSets: 4,
            defaultReps: '6',
            defaultDurationSeconds: 40,
            defaultRestSeconds: 20,
            defaultNotes: 'Keep it slow',
          }),
        }))
      )
      .returning();

    await tx
      .insert(videoTags)
      .values(pool.map((video) => ({ videoId: video.id, tagId: poolTag.id })));

    const [session] = await tx
      .select({ id: templateSessions.id })
      .from(templateSessions)
      .innerJoin(templatePhases, eq(templatePhases.id, templateSessions.templatePhaseId))
      .where(
        and(
          eq(templatePhases.programmeTemplateId, fixture.templateId),
          eq(templatePhases.phaseNumber, 1),
          eq(templateSessions.sessionNumber, 1)
        )
      );

    return {
      slottedSessionId: session.id,
      poolTagId: poolTag.id,
      emptyTagId: emptyTag.id,
      pool,
      extraTagIds: [],
    };
  });
}

async function addSlot(
  fixture: Fixture,
  sessionId: string,
  orderIndex: number,
  tagId: string,
  isRequired = true
): Promise<void> {
  await withRLS(fixture.organisationId, undefined, async (tx) => {
    const [movement] = await tx
      .select({ id: tagCategories.id })
      .from(tagCategories)
      .where(eq(tagCategories.slug, 'movement'));
    const [slot] = await tx
      .insert(templateSessionSlots)
      .values({ templateSessionId: sessionId, tagCategoryId: movement.id, orderIndex, isRequired })
      .returning();

    await tx.insert(templateSlotTags).values({ slotId: slot.id, tagId });
  });
}

async function removeSlotData(fixture: Fixture, data: SlotData): Promise<void> {
  await withRLS(fixture.organisationId, undefined, async (tx) => {
    await tx.delete(videos).where(
      inArray(
        videos.id,
        data.pool.map((video) => video.id)
      )
    );
    await tx
      .delete(tags)
      .where(inArray(tags.id, [data.poolTagId, data.emptyTagId, ...data.extraTagIds]));

    if (data.flowId) {
      await tx.delete(assessmentFlows).where(eq(assessmentFlows.id, data.flowId));
    }

    if (data.questionId) {
      await tx.delete(questions).where(eq(questions.id, data.questionId));
    }
  });
}

/** The member exercises written for one template session of a programme */
async function readSessionExercises(
  tx: Transaction,
  programmeId: string,
  templateSessionId: string
): Promise<UserSessionExerciseRecord[]> {
  const sessions = await tx
    .select({ id: userSessions.id })
    .from(userSessions)
    .innerJoin(programmePhases, eq(programmePhases.id, userSessions.programmePhaseId))
    .where(
      and(
        eq(programmePhases.programmeId, programmeId),
        eq(userSessions.templateSessionId, templateSessionId)
      )
    );

  return await tx
    .select()
    .from(userSessionExercises)
    .where(
      inArray(
        userSessionExercises.userSessionId,
        sessions.map((session) => session.id)
      )
    )
    .orderBy(asc(userSessionExercises.orderIndex));
}

const replaceFor = (fixture: Fixture): Promise<string> =>
  withRLS(fixture.organisationId, fixture.userId, async (tx) => {
    const result = await generateProgramme(
      {
        organisationId: fixture.organisationId,
        userId: fixture.userId,
        recommendedTemplateSlug: fixture.templateSlug,
        replaceExisting: true,
      },
      { tx }
    );

    return result.programmeId;
  });

describe('Programme assembly', () => {
  let fixture: Fixture;
  let data: SlotData;

  beforeEach(async () => {
    fixture = await createFixture();
    data = await addSlotData(fixture);
  });

  afterEach(async () => {
    await removeFixture(fixture);
    await removeSlotData(fixture, data);
  });

  afterAll(async () => {
    await closePool();
  });

  it('draws a slotted session from its pool, prescribed by the video defaults', async () => {
    for (const orderIndex of [0, 1, 2, 3]) {
      await addSlot(fixture, data.slottedSessionId, orderIndex, data.poolTagId);
    }

    const programmeId = await generateFor(fixture);

    await withRLS(fixture.organisationId, fixture.userId, async (tx) => {
      const drawn = await readSessionExercises(tx, programmeId, data.slottedSessionId);
      const [withDefaults, ...withoutDefaults] = data.pool;

      // Four slots on a pool of four take every video once
      expect(drawn.map((row) => row.videoId).sort()).toEqual(
        data.pool.map((video) => video.id).sort()
      );
      expect(drawn.map((row) => row.orderIndex)).toEqual([0, 1, 2, 3]);
      expect(drawn.every((row) => row.sourceSessionExerciseId === null)).toBe(true);
      expect(drawn.find((row) => row.videoId === withDefaults.id)).toMatchObject({
        sets: 4,
        reps: '6',
        durationSeconds: 40,
        restSeconds: 20,
        notes: 'Keep it slow',
      });

      for (const video of withoutDefaults) {
        expect(drawn.find((row) => row.videoId === video.id)).toMatchObject({
          sets: 3,
          reps: '10',
          durationSeconds: null,
          restSeconds: null,
          notes: null,
        });
      }
    });
  });

  it('copies the fixed exercises of a session without slots', async () => {
    await addSlot(fixture, data.slottedSessionId, 0, data.poolTagId);

    const programmeId = await generateFor(fixture);

    await withRLS(fixture.organisationId, fixture.userId, async (tx) => {
      const [unslotted] = await tx
        .select({ id: templateSessions.id })
        .from(templateSessions)
        .innerJoin(templatePhases, eq(templatePhases.id, templateSessions.templatePhaseId))
        .where(
          and(
            eq(templatePhases.programmeTemplateId, fixture.templateId),
            eq(templatePhases.phaseNumber, 2)
          )
        );
      const copied = await readSessionExercises(tx, programmeId, unslotted.id);

      expect(copied).toHaveLength(2);
      expect(copied.every((row) => row.sourceSessionExerciseId !== null)).toBe(true);
      expect(copied.map((row) => row.videoId)).toEqual(fixture.videoIds);
    });
  });

  it('can draw a different set when the programme is replaced', async () => {
    await addSlot(fixture, data.slottedSessionId, 0, data.poolTagId);
    await addSlot(fixture, data.slottedSessionId, 1, data.poolTagId);

    const draws = new Set<string>();

    for (let attempt = 0; attempt < 6; attempt++) {
      const programmeId = attempt === 0 ? await generateFor(fixture) : await replaceFor(fixture);

      const drawn = await withRLS(fixture.organisationId, fixture.userId, (tx) =>
        readSessionExercises(tx, programmeId, data.slottedSessionId)
      );

      draws.add(drawn.map((row) => row.videoId).join(','));
    }

    expect(draws.size).toBeGreaterThan(1);
  });

  it('writes nothing when a required slot cannot fill, and fails the job without a retry', async () => {
    await addSlot(fixture, data.slottedSessionId, 0, data.poolTagId);
    await addSlot(fixture, data.slottedSessionId, 1, data.emptyTagId);

    await expect(generateFor(fixture)).rejects.toBeInstanceOf(ProgrammeAssemblyError);

    await withRLS(fixture.organisationId, fixture.userId, async (tx) => {
      const written = await tx
        .select()
        .from(programmes)
        .where(eq(programmes.userId, fixture.userId));
      const sessions = await tx
        .select()
        .from(userSessions)
        .where(eq(userSessions.organisationId, fixture.organisationId));

      expect(written).toEqual([]);
      expect(sessions).toEqual([]);
    });

    const payload = {
      assessmentSubmissionId: randomUUID(),
      userId: fixture.userId,
      recommendedTemplateSlug: fixture.templateSlug,
    };
    const job = await withRLS(fixture.organisationId, undefined, async (tx) => {
      const [created] = await tx
        .insert(processJobs)
        .values({
          organisationId: fixture.organisationId,
          type: 'generate_programme',
          payload,
          status: 'processing',
          attempts: 1,
        })
        .returning();

      return created;
    });

    const error = await processGenerateProgramme(payload, fixture.organisationId).then(
      () => null,
      (rejection: unknown) => rejection
    );

    expect(error).toBeInstanceOf(ProgrammeAssemblyError);

    const result = await failJob(job, error as Error);

    expect(result).toMatchObject({ willRetry: false, newStatus: 'failed' });
    expect(
      await hasProgrammeGenerationFailed(fixture.organisationId, payload.assessmentSubmissionId)
    ).toBe(true);
    expect(await hasProgrammeGenerationFailed(fixture.organisationId, randomUUID())).toBe(false);
  });

  it('weights the draw by the answers of the assessment the job generates from', async () => {
    const emphasisedSlug = `assembly-emphasis-${shortId()}`;
    const [emphasised] = data.pool.slice(2);
    const flowId = randomUUID();
    const questionId = randomUUID();
    const assessmentId = randomUUID();

    const sessionIds = await withRLS(fixture.organisationId, undefined, async (tx) => {
      const [movement] = await tx
        .select({ id: tagCategories.id })
        .from(tagCategories)
        .where(eq(tagCategories.slug, 'movement'));
      const [tag] = await tx
        .insert(tags)
        .values({ categoryId: movement.id, slug: emphasisedSlug, label: emphasisedSlug })
        .returning();

      data.extraTagIds.push(tag.id);
      await tx.insert(videoTags).values({ videoId: emphasised.id, tagId: tag.id });
      await tx.insert(questions).values({
        id: questionId,
        slug: `assembly-${shortId()}`,
        type: 'single-choice',
        questionText: 'How active are you?',
      });
      await tx.insert(assessmentFlows).values({
        id: flowId,
        name: `Assembly flow ${shortId()}`,
        scoringConfig: {
          dimensions: [],
          programmeMappings: [],
          emphasis: [
            {
              questionId,
              answerValue: 'low',
              tags: [{ category: 'movement', slug: emphasisedSlug, weight: 1_000_000 }],
            },
          ],
        },
      });
      await tx.insert(userAssessments).values({
        id: assessmentId,
        organisationId: fixture.organisationId,
        userId: fixture.userId,
        flowId,
        status: 'scored',
      });
      await tx.insert(userAssessmentAnswers).values({
        organisationId: fixture.organisationId,
        userAssessmentId: assessmentId,
        questionId,
        answerValue: 'low',
      });

      const sessions = await tx
        .select({ id: templateSessions.id })
        .from(templateSessions)
        .innerJoin(templatePhases, eq(templatePhases.id, templateSessions.templatePhaseId))
        .where(eq(templatePhases.programmeTemplateId, fixture.templateId));

      return sessions.map((session) => session.id);
    });

    data.flowId = flowId;
    data.questionId = questionId;

    // Three sessions: unweighted, all three draw the emphasised video one time in 64
    for (const sessionId of sessionIds) {
      await addSlot(fixture, sessionId, 0, data.poolTagId);
    }

    const { programmeId } = await processGenerateProgramme(
      {
        assessmentSubmissionId: assessmentId,
        userId: fixture.userId,
        recommendedTemplateSlug: fixture.templateSlug,
      },
      fixture.organisationId
    );

    await withRLS(fixture.organisationId, fixture.userId, async (tx) => {
      for (const sessionId of sessionIds) {
        const drawn = await readSessionExercises(tx, programmeId, sessionId);

        expect(drawn.map((row) => row.videoId)).toEqual([emphasised.id]);
      }
    });
  });

  it('skips an optional slot with an empty pool', async () => {
    await addSlot(fixture, data.slottedSessionId, 0, data.poolTagId);
    await addSlot(fixture, data.slottedSessionId, 1, data.emptyTagId, false);

    const programmeId = await generateFor(fixture);

    const drawn = await withRLS(fixture.organisationId, fixture.userId, (tx) =>
      readSessionExercises(tx, programmeId, data.slottedSessionId)
    );

    expect(drawn).toHaveLength(1);
    expect(drawn[0].orderIndex).toBe(0);
  });
});
