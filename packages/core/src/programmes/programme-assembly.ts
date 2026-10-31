import {
  fromDrawnVideo,
  fromTemplateExercise,
  type DbQueryClient,
  type MemberSessionExerciseFields,
} from '@ffp/database';
import type { VideoRecord } from '@ffp/database/schema';

import { ProgrammeAssemblyError } from '../lib/errors';
import { createSystemLogger } from '../lib/logger';
import { templateSlotService } from '../programme-templates';
import { SESSION_SLOT_LIMITS } from '../schemas/programme/programme.schema';
import * as tagRepository from '../tags/tag.repository';

import { assembleSession, type EmphasisWeights } from './assembly';

import type { TemplateSessionWithExercises, TemplateStructure } from './programme.repository';
import type { SlotToDraw } from '../programme-templates/template-slot.service';
import type { PoolVideoQuery } from '../tags/tag.repository';

const logger = createSystemLogger('programme-assembly');

export interface ChooseSessionExercisesInput {
  organisationId: string;
  programmeId: string;
  templateSlug: string;
  templateStructure: TemplateStructure;
  emphasis: EmphasisWeights;
}

/** Reads each pool once per generation; slots naming the same tags share it */
function createPoolReader(db: DbQueryClient): (query: PoolVideoQuery) => Promise<VideoRecord[]> {
  const pools = new Map<string, Promise<VideoRecord[]>>();

  return (query) => {
    const key = `${query.categoryId}:${[...(query.tagIds ?? [])].sort().join(',')}`;
    const pool = pools.get(key) ?? tagRepository.findPoolVideos(db, query);

    pools.set(key, pool);

    return pool;
  };
}

/**
 * Reads each video's tags as `category:slug` once per generation. Only emphasis looks at them,
 * so with none there is nothing to read.
 */
function createTagKeyReader(
  db: DbQueryClient,
  emphasis: EmphasisWeights
): (videoIds: string[]) => Promise<Map<string, string[]>> {
  const tagKeysByVideo = new Map<string, string[]>();

  return async (videoIds) => {
    const unread = videoIds.filter((videoId) => !tagKeysByVideo.has(videoId));

    if (emphasis.size > 0 && unread.length > 0) {
      for (const videoId of unread) {
        tagKeysByVideo.set(videoId, []);
      }

      for (const row of await tagRepository.findVideoTags(db, unread)) {
        tagKeysByVideo.get(row.videoId)?.push(`${row.category}:${row.slug}`);
      }
    }

    return tagKeysByVideo;
  };
}

interface SessionReaders {
  readPool: (query: PoolVideoQuery) => Promise<VideoRecord[]>;
  readTagKeys: (videoIds: string[]) => Promise<Map<string, string[]>>;
}

async function drawSession(
  { readPool, readTagKeys }: SessionReaders,
  { session }: TemplateSessionWithExercises,
  slots: SlotToDraw[],
  input: ChooseSessionExercisesInput
): Promise<MemberSessionExerciseFields[]> {
  const pools = await Promise.all(
    slots.map((slot) =>
      readPool(templateSlotService.toSlotPoolQuery(slot.tagCategoryId, slot.tagIds))
    )
  );
  const videosById = new Map(pools.flat().map((video) => [video.id, video]));
  const tagKeysByVideo = await readTagKeys([...videosById.keys()]);

  const result = assembleSession({
    slots: slots.map((slot, index) => ({
      slotId: slot.id,
      orderIndex: slot.orderIndex,
      isRequired: slot.isRequired,
      candidates: pools[index].map((video) => ({
        videoId: video.id,
        isEssential: video.isEssential,
        tagKeys: tagKeysByVideo.get(video.id) ?? [],
      })),
    })),
    emphasis: input.emphasis,
    // Per session, so adding a session to a template leaves the others' draws alone
    seed: `${input.programmeId}:${session.id}`,
  });

  if (result.unfilledRequired.length > 0) {
    logger.error('Required slot could not be filled', {
      organisationId: input.organisationId,
      templateSlug: input.templateSlug,
      sessionPublicId: session.publicId,
      slots: slots
        .filter((slot) => result.unfilledRequired.includes(slot.id))
        .map((slot) => ({ slotPublicId: slot.publicId, category: slot.category })),
    });

    throw new ProgrammeAssemblyError();
  }

  if (result.picks.length < SESSION_SLOT_LIMITS.min) {
    logger.warn('Session drew fewer than the minimum exercises', {
      organisationId: input.organisationId,
      templateSlug: input.templateSlug,
      sessionPublicId: session.publicId,
      exerciseCount: result.picks.length,
    });
  }

  return result.picks.flatMap(({ videoId }, orderIndex) => {
    const video = videosById.get(videoId);

    return video ? [fromDrawnVideo(video, orderIndex)] : [];
  });
}

/**
 * The exercises each template session gives a new programme, keyed by template session id. A
 * session with slots is drawn from them; one without copies its fixed exercises.
 */
export async function chooseSessionExercises(
  db: DbQueryClient,
  input: ChooseSessionExercisesInput
): Promise<Map<string, MemberSessionExerciseFields[]>> {
  const templateSessions = [...input.templateStructure.phases.values()].flatMap(
    ({ sessions }) => sessions
  );
  const slotsBySession = await templateSlotService.findSlotsToDraw(
    db,
    templateSessions.map(({ session }) => session.id)
  );
  const readers: SessionReaders = {
    readPool: createPoolReader(db),
    readTagKeys: createTagKeyReader(db, input.emphasis),
  };
  const exercisesBySession = new Map<string, MemberSessionExerciseFields[]>();

  for (const templateSession of templateSessions) {
    const slots = slotsBySession.get(templateSession.session.id);

    exercisesBySession.set(
      templateSession.session.id,
      slots
        ? await drawSession(readers, templateSession, slots, input)
        : templateSession.exercises.map(fromTemplateExercise)
    );
  }

  return exercisesBySession;
}
