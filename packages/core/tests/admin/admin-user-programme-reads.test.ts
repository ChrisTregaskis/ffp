import { randomUUID } from 'crypto';

import { eq, inArray } from 'drizzle-orm';
import { describe, it, expect, beforeEach, afterEach, afterAll } from 'vitest';

import { processJobs, programmes, users } from '@ffp/database/schema';

import { getUserProgrammeService, listUsersService } from '../../src/admin/admin-user.service';
import { closePool, db, withRLS } from '../../src/lib/database';
import { getProgrammeDetail } from '../../src/programmes/programme.service';
import { paginationInputSchema } from '../../src/schemas/pagination.schema';
import {
  createFixture,
  generateFor,
  memberContext,
  removeFixture,
  shortId,
  type Fixture,
} from '../programmes/programme-fixture';

import type { OrganisationContext } from '../../src/lib/context';
import type { UserListResponse } from '../../src/schemas/user.schema';

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

const page = (
  overrides: Record<string, unknown> = {}
): ReturnType<typeof paginationInputSchema.parse> =>
  paginationInputSchema.parse({ page: 1, pageSize: 20, ...overrides });

describe('Admin reads of members’ programmes', () => {
  let member: Fixture;
  let other: Fixture;
  let memberLocationId: string;
  let otherLocationId: string;
  let memberPublicId: string;
  let otherUserPublicId: string;
  let jobIds: string[];

  const memberRow = async (
    fixture: Fixture,
    userId: string
  ): Promise<{ locationId: string | null; publicId: string }> =>
    await withRLS(fixture.organisationId, undefined, async (tx) => {
      const [row] = await tx
        .select({ locationId: users.locationId, publicId: users.publicId })
        .from(users)
        .where(eq(users.id, userId));

      return row;
    });

  const addUsers = async (
    fixture: Fixture,
    locationId: string,
    people: { firstName: string; lastName: string; role?: 'customer_admin'; createdAt?: Date }[],
    ids: string[] = people.map(() => randomUUID())
  ): Promise<string[]> => {
    await withRLS(fixture.organisationId, undefined, async (tx) => {
      for (const [index, person] of people.entries()) {
        await tx.insert(users).values({
          id: ids[index],
          organisationId: fixture.organisationId,
          locationId,
          email: `admin-reads-${shortId()}@test.com`,
          cognitoSub: `cognito-${shortId()}`,
          role: person.role ?? 'programme_user',
          ...person,
        });
      }
    });

    return ids;
  };

  const addJob = async (
    organisationId: string,
    userId: string,
    status: 'failed' | 'completed',
    createdAt: Date
  ): Promise<void> => {
    const [job] = await db
      .insert(processJobs)
      .values({
        organisationId,
        type: 'generate_programme',
        payload: { userId, assessmentSubmissionId: randomUUID() },
        status,
        createdAt,
      })
      .returning({ id: processJobs.id });
    jobIds.push(job.id);
  };

  const listLocation = async (
    locationId: string,
    overrides: Record<string, unknown> = {}
  ): Promise<UserListResponse[]> =>
    (await listUsersService(adminContext(), page(overrides), { locationId })).data;

  beforeEach(async () => {
    member = await createFixture();
    other = await createFixture();
    jobIds = [];
    await generateFor(member);

    const memberUser = await memberRow(member, member.userId);
    memberLocationId = memberUser.locationId ?? '';
    memberPublicId = memberUser.publicId;
    ({ publicId: otherUserPublicId } = await memberRow(member, member.otherUserId));
    otherLocationId = (await memberRow(other, other.userId)).locationId ?? '';
  });

  afterEach(async () => {
    if (jobIds.length > 0) {
      await db.delete(processJobs).where(inArray(processJobs.id, jobIds));
    }
    await removeFixture(member);
    await removeFixture(other);
  });

  afterAll(async () => {
    await closePool();
  });

  describe('the users list', () => {
    it('shows each member’s current programme from any organisation, and none for the rest', async () => {
      const rows = await listLocation(memberLocationId, { sortBy: 'fullName' });

      expect(
        rows.map(({ firstName, programmeName, programmeStatus, programmeLevel }) => ({
          firstName,
          programmeName,
          programmeStatus,
          programmeLevel,
        }))
      ).toEqual([
        {
          firstName: 'Mara',
          programmeName: 'Materialisation template',
          programmeStatus: 'active',
          // The fixture template's slug is not one of the level shells
          programmeLevel: null,
        },
        { firstName: 'Omar', programmeName: null, programmeStatus: null, programmeLevel: null },
      ]);
    });

    it('treats an archived programme as no programme', async () => {
      await withRLS(member.organisationId, undefined, (tx) =>
        tx
          .update(programmes)
          .set({ status: 'archived' })
          .where(eq(programmes.userId, member.userId))
      );

      const [mara] = await listLocation(memberLocationId, { sortBy: 'fullName' });

      expect(mara).toMatchObject({ programmeName: null, programmeStatus: null });
    });

    it('marks a member whose latest generation failed, until a newer one completes', async () => {
      await addJob(member.organisationId, member.userId, 'failed', new Date('2026-01-01'));
      // The same user id under another organisation must not count for this member
      await addJob(other.organisationId, member.otherUserId, 'failed', new Date('2026-01-01'));

      const failedOnly = await listLocation(memberLocationId, { sortBy: 'fullName' });
      expect(failedOnly.map((row) => row.generationFailed)).toEqual([true, false]);

      await addJob(member.organisationId, member.userId, 'completed', new Date('2026-01-02'));

      const thenCompleted = await listLocation(memberLocationId, { sortBy: 'fullName' });
      expect(thenCompleted.map((row) => row.generationFailed)).toEqual([false, false]);
    });

    // Two programmes created in the same instant, the lower id inserted first
    it.each([
      ['paused', 'active'],
      ['active', 'paused'],
    ] as const)(
      'breaks a tie on creation time by id: the lower id (%s) loses to the higher (%s)',
      async (lowerStatus, higherStatus) => {
        const createdAt = new Date('2030-01-01T09:00:00.000Z');
        const [lowerId, higherId] = [randomUUID(), randomUUID()].sort();
        await withRLS(member.organisationId, undefined, async (tx) => {
          for (const [id, status] of [
            [lowerId, lowerStatus],
            [higherId, higherStatus],
          ] as const) {
            await tx.insert(programmes).values({
              id,
              organisationId: member.organisationId,
              userId: member.userId,
              programmeTemplateId: member.templateId,
              name: 'Tied programme',
              status,
              createdAt,
            });
          }
        });

        const [mara] = await listLocation(memberLocationId, { sortBy: 'fullName' });

        expect(mara.programmeStatus).toBe(higherStatus);
      }
    );

    it('sorts by name as surname, then first name', async () => {
      await addUsers(member, memberLocationId, [
        { firstName: 'Zara', lastName: 'Member' },
        { firstName: 'Aaron', lastName: 'Zed' },
      ]);

      const ascending = await listLocation(memberLocationId, { sortBy: 'fullName' });
      const descending = await listLocation(memberLocationId, {
        sortBy: 'fullName',
        sortDirection: 'desc',
      });

      expect(ascending.map((row) => `${row.firstName} ${row.lastName}`)).toEqual([
        'Mara Member',
        'Zara Member',
        'Omar Other',
        'Aaron Zed',
      ]);
      expect(descending.map((row) => row.firstName)).toEqual(['Aaron', 'Omar', 'Zara', 'Mara']);
    });

    it('orders rows tied on the sort column by id, so the pages neither repeat nor skip one', async () => {
      // Inserted in descending id order, so an untied sort (which here returns insertion order)
      // cannot pass by chance
      const ids = Array.from({ length: 4 }, () => randomUUID())
        .sort()
        .reverse();
      const tiedAt = new Date('2020-01-01T00:00:00Z');
      await addUsers(
        other,
        otherLocationId,
        ids.map((_, index) => ({ firstName: 'Tied', lastName: String(index), createdAt: tiedAt })),
        ids
      );

      const pages: Awaited<ReturnType<typeof listLocation>>[] = [];
      for (const pageNumber of [1, 2]) {
        pages.push(
          await listLocation(otherLocationId, {
            page: pageNumber,
            pageSize: 2,
            sortBy: 'createdAt',
          })
        );
      }

      expect(pages.flat().map((row) => row.id)).toEqual([...ids].sort());
    });

    it('filters by the Customer Staff role list', async () => {
      const [staffId] = await addUsers(member, memberLocationId, [
        { firstName: 'Cara', lastName: 'Staff', role: 'customer_admin' },
      ]);

      const { data } = await listUsersService(adminContext(), page(), {
        locationId: memberLocationId,
        role: 'customer_owner,customer_admin',
      });

      expect(data.map((row) => row.id)).toEqual([staffId]);
    });
  });

  describe('one member’s programme', () => {
    it('reads the programme under the member’s own organisation, as the member sees it', async () => {
      const asAdmin = await getUserProgrammeService(adminContext(), memberPublicId);

      expect(asAdmin).toEqual(await getProgrammeDetail(memberContext(member)));
    });

    it('answers 404 for an unknown user', async () => {
      await expect(getUserProgrammeService(adminContext(), 'unknownuser1')).rejects.toMatchObject({
        statusCode: 404,
        message: 'User with id unknownuser1 not found',
      });
    });

    it('answers 404 for a user with no programme', async () => {
      await expect(
        getUserProgrammeService(adminContext(), otherUserPublicId)
      ).rejects.toMatchObject({ statusCode: 404, message: 'Active programme not found' });
    });
  });
});
