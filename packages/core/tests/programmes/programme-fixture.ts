import { randomUUID } from 'crypto';

import { eq, inArray } from 'drizzle-orm';

import {
  locations,
  organisations,
  programmeTemplates,
  sessionExercises,
  templatePhases,
  templateSessions,
  userAssessments,
  userSessions,
  users,
  videos,
} from '@ffp/database/schema';

import { withRLS } from '../../src/lib/database';
import { generateProgramme } from '../../src/programmes/programme.service';

import type { OrganisationContext, UserActor } from '../../src/lib/context';

/** Template fixture: phase 1 has two sessions (2 + 1 exercises), phase 2 one session (2). */
export const TEMPLATE_SHAPE = [
  { phaseNumber: 1, sessions: [2, 1] },
  { phaseNumber: 2, sessions: [2] },
];

export interface Fixture {
  organisationId: string;
  userId: string;
  cognitoSub: string;
  /** A second member in the same organisation */
  otherUserId: string;
  templateId: string;
  templateSlug: string;
  videoIds: string[];
}

export const shortId = (): string => randomUUID().replace(/-/g, '').slice(0, 12);

export async function createFixture(): Promise<Fixture> {
  const organisationId = randomUUID();
  const userId = randomUUID();
  const templateId = randomUUID();
  const templateSlug = `materialisation-${shortId()}`;
  const videoIds = [randomUUID(), randomUUID()];
  const cognitoSub = `cognito-${shortId()}`;
  const otherUserId = randomUUID();

  await withRLS(organisationId, undefined, async (tx) => {
    await tx.insert(organisations).values({
      id: organisationId,
      type: 'business',
      name: `Materialisation test ${templateSlug}`,
      settings: {},
    });

    const locationId = randomUUID();
    await tx.insert(locations).values({
      id: locationId,
      organisationId,
      name: 'Materialisation location',
      accountCode: `LOC-${shortId()}`,
      status: 'active',
    });

    await tx.insert(users).values({
      id: userId,
      organisationId,
      locationId,
      email: `materialisation-${shortId()}@test.com`,
      cognitoSub,
      firstName: 'Mara',
      lastName: 'Member',
      role: 'programme_user',
    });

    await tx.insert(users).values({
      id: otherUserId,
      organisationId,
      locationId,
      email: `materialisation-${shortId()}@test.com`,
      cognitoSub: `cognito-${shortId()}`,
      firstName: 'Omar',
      lastName: 'Other',
      role: 'programme_user',
    });

    await tx.insert(videos).values(
      videoIds.map((id, index) => ({
        id,
        title: `Materialisation video ${String(index)}`,
        s3Key: `tests/materialisation/${shortId()}.mp4`,
        durationSeconds: 60,
        fileSizeBytes: 1024,
        equipment: [],
      }))
    );

    await tx.insert(programmeTemplates).values({
      id: templateId,
      slug: templateSlug,
      name: 'Materialisation template',
      totalPhases: TEMPLATE_SHAPE.length,
    });

    for (const phaseShape of TEMPLATE_SHAPE) {
      const [phase] = await tx
        .insert(templatePhases)
        .values({
          programmeTemplateId: templateId,
          phaseNumber: phaseShape.phaseNumber,
          name: `Phase ${String(phaseShape.phaseNumber)}`,
        })
        .returning();

      for (const [sessionIndex, exerciseCount] of phaseShape.sessions.entries()) {
        const [session] = await tx
          .insert(templateSessions)
          .values({ templatePhaseId: phase.id, sessionNumber: sessionIndex + 1 })
          .returning();

        await tx.insert(sessionExercises).values(
          Array.from({ length: exerciseCount }, (_, orderIndex) => ({
            templateSessionId: session.id,
            videoId: videoIds[orderIndex % videoIds.length],
            orderIndex,
            sets: 2 + orderIndex,
            reps: `${String(8 + orderIndex)}-12`,
            durationSeconds: orderIndex === 0 ? null : 30,
            restSeconds: 45,
            notes: `Note ${String(phaseShape.phaseNumber)}.${String(sessionIndex)}.${String(orderIndex)}`,
          }))
        );
      }
    }
  });

  return { organisationId, userId, cognitoSub, otherUserId, templateId, templateSlug, videoIds };
}

export async function removeFixture(fixture: Fixture): Promise<void> {
  await withRLS(fixture.organisationId, undefined, async (tx) => {
    await tx
      .delete(userAssessments)
      .where(eq(userAssessments.organisationId, fixture.organisationId));
    // user_sessions restrict their phase, so they go before the organisation cascade
    await tx.delete(userSessions).where(eq(userSessions.organisationId, fixture.organisationId));
    await tx.delete(organisations).where(eq(organisations.id, fixture.organisationId));
    await tx.delete(programmeTemplates).where(eq(programmeTemplates.id, fixture.templateId));
    await tx.delete(videos).where(inArray(videos.id, fixture.videoIds));
  });
}

/** A programme user's request context for the fixture member. */
export const memberContext = (fixture: Fixture): OrganisationContext => ({
  actor: {
    type: 'user',
    userId: fixture.cognitoSub,
    userRole: 'programme_user',
    email: 'member@test.com',
  } as UserActor,
  organisationId: fixture.organisationId,
  locationId: null,
  requestId: randomUUID(),
  timestamp: new Date(),
});

/** Generate the fixture member's programme from the fixture template, as the scoring job does. */
export const generateFor = (fixture: Fixture): Promise<string> =>
  withRLS(fixture.organisationId, fixture.userId, async (tx) => {
    const result = await generateProgramme(
      {
        organisationId: fixture.organisationId,
        userId: fixture.userId,
        recommendedTemplateSlug: fixture.templateSlug,
      },
      { tx }
    );

    return result.programmeId;
  });
