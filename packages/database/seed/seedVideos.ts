import { and, eq, isNull } from 'drizzle-orm';
import { type NodePgDatabase } from 'drizzle-orm/node-postgres';
import { type Pool } from 'pg';

import { createLogger } from '../src/lib/logger.js';
import { tagCategories, tags, videos, videoTags } from '../src/schema/index.js';

import { requireSeedId } from './requireSeedId.js';

import type { TagCategorySlug } from '../src/constants/tag.constants.js';
import type * as schema from '../src/schema/index.js';
import type { NewVideo } from '../src/schema/videos.js';

/** A seed video and the typed tags it carries, as tag slugs per category */
interface SeedVideo extends NewVideo {
  videoTags: Partial<Record<TagCategorySlug, string[]>>;
}

const logger = createLogger('seed-videos');

/**
 * Deterministic UUIDs for seed videos
 *
 * These are fixed to ensure consistency across seed runs.
 *
 * UUID Pattern: 77777777-7777-7777-8777-7777777700XX
 */
export const VIDEO_IDS = {
  'seated-hamstring-stretch': '77777777-7777-7777-8777-777777770001',
  'standing-quad-stretch': '77777777-7777-7777-8777-777777770002',
  'resistance-band-row': '77777777-7777-7777-8777-777777770003',
  'bodyweight-squat': '77777777-7777-7777-8777-777777770004',
  'single-leg-balance': '77777777-7777-7777-8777-777777770005',
  'cat-cow-stretch': '77777777-7777-7777-8777-777777770006',
  'wall-push-up': '77777777-7777-7777-8777-777777770007',
  'ankle-mobility-circles': '77777777-7777-7777-8777-777777770008',
  'glute-bridge': '77777777-7777-7777-8777-777777770009',
  'draft-shoulder-press': '77777777-7777-7777-8777-777777770010',
} as const;

/**
 * Seed video definitions — realistic exercise video catalogue entries
 *
 * Covers a variety of:
 * - Difficulties: beginner, intermediate, advanced
 * - Equipment: none, resistance_band, yoga_mat, chair
 * - Statuses: mostly active, one draft for testing
 */
const DEFAULT_VIDEOS: SeedVideo[] = [
  {
    id: VIDEO_IDS['seated-hamstring-stretch'],
    title: 'Seated Hamstring Stretch',
    description:
      'A gentle seated stretch targeting the hamstrings. Ideal for users with limited mobility ' +
      'or those recovering from lower back issues. Perform slowly and hold for 20-30 seconds each side.',
    s3Key: 'library/77777777-7777-7777-8777-777777770001.mp4',

    durationSeconds: 180,
    fileSizeBytes: 45_000_000,
    mimeType: 'video/mp4',
    status: 'active',
    difficulty: 'beginner',
    equipment: ['chair'],
    defaultSets: 2,
    defaultReps: '30s hold',
    defaultRestSeconds: 15,
    defaultNotes: 'Keep your back tall and ease into the stretch.',
    videoTags: {
      movement: ['stretch'],
      'body-area': ['hamstrings', 'lower-back'],
      audience: ['gentle', 'seated'],
    },
  },
  {
    id: VIDEO_IDS['standing-quad-stretch'],
    title: 'Standing Quad Stretch',
    description:
      'A standing quadriceps stretch with optional wall support for balance. ' +
      'Hold each side for 20-30 seconds, focusing on keeping the knees together.',
    s3Key: 'library/77777777-7777-7777-8777-777777770002.mp4',

    durationSeconds: 150,
    fileSizeBytes: 38_000_000,
    mimeType: 'video/mp4',
    status: 'active',
    difficulty: 'beginner',
    equipment: ['none'],
    videoTags: { movement: ['stretch'], 'body-area': ['quadriceps', 'hip-flexors'] },
  },
  {
    id: VIDEO_IDS['resistance-band-row'],
    title: 'Resistance Band Seated Row',
    description:
      'Strengthen the upper back and improve posture with this seated resistance band row. ' +
      'Perform 3 sets of 10-12 repetitions with controlled movement.',
    s3Key: 'library/77777777-7777-7777-8777-777777770003.mp4',

    durationSeconds: 240,
    fileSizeBytes: 62_000_000,
    mimeType: 'video/mp4',
    status: 'active',
    difficulty: 'intermediate',
    equipment: ['resistance_band'],
    defaultSets: 3,
    defaultReps: '10-12',
    defaultRestSeconds: 60,
    defaultNotes: 'Squeeze the shoulder blades together at the end of each pull.',
    videoTags: {
      goal: ['posture'],
      movement: ['strength'],
      'body-area': ['upper-back', 'shoulders', 'biceps'],
    },
  },
  {
    id: VIDEO_IDS['bodyweight-squat'],
    title: 'Bodyweight Squat',
    description:
      'A fundamental lower-body strength exercise. Focus on proper form: chest up, ' +
      'knees tracking over toes, and sitting back into the heels. Perform 3 sets of 12-15 reps.',
    s3Key: 'library/77777777-7777-7777-8777-777777770004.mp4',

    durationSeconds: 300,
    fileSizeBytes: 78_000_000,
    mimeType: 'video/mp4',
    status: 'active',
    difficulty: 'intermediate',
    equipment: ['none'],
    videoTags: { movement: ['strength'], 'body-area': ['quadriceps', 'glutes', 'hamstrings'] },
  },
  {
    id: VIDEO_IDS['single-leg-balance'],
    title: 'Single Leg Balance Hold',
    description:
      'Improve proprioception and ankle stability with this single-leg balance exercise. ' +
      'Hold for 30 seconds each side. Progress by closing your eyes or standing on an uneven surface.',
    s3Key: 'library/77777777-7777-7777-8777-777777770005.mp4',

    durationSeconds: 120,
    fileSizeBytes: 30_000_000,
    mimeType: 'video/mp4',
    status: 'active',
    difficulty: 'beginner',
    equipment: ['none'],
    defaultSets: 3,
    defaultReps: '30s each leg',
    defaultRestSeconds: 20,
    videoTags: { movement: ['balance'], 'body-area': ['ankles', 'calves', 'core'] },
  },
  {
    id: VIDEO_IDS['cat-cow-stretch'],
    title: 'Cat-Cow Spinal Mobilisation',
    description:
      'A gentle spinal mobilisation exercise performed on all fours. Alternate between ' +
      'arching and rounding the back, synchronising with your breath. Perform 10-12 repetitions.',
    s3Key: 'library/77777777-7777-7777-8777-777777770006.mp4',

    durationSeconds: 200,
    fileSizeBytes: 52_000_000,
    mimeType: 'video/mp4',
    status: 'active',
    difficulty: 'beginner',
    equipment: ['yoga_mat'],
    videoTags: {
      movement: ['mobility'],
      'body-area': ['spine', 'core', 'lower-back'],
      audience: ['gentle'],
    },
  },
  {
    id: VIDEO_IDS['wall-push-up'],
    title: 'Wall Push-Up',
    description:
      'A modified push-up using a wall for support, suitable for beginners or those building ' +
      'upper-body strength. Perform 3 sets of 10-15 reps with a controlled tempo.',
    s3Key: 'library/77777777-7777-7777-8777-777777770007.mp4',

    durationSeconds: 210,
    fileSizeBytes: 55_000_000,
    mimeType: 'video/mp4',
    status: 'active',
    difficulty: 'beginner',
    equipment: ['none'],
    videoTags: {
      movement: ['strength'],
      'body-area': ['chest', 'shoulders', 'triceps'],
      audience: ['beginner-friendly'],
    },
  },
  {
    id: VIDEO_IDS['ankle-mobility-circles'],
    title: 'Ankle Mobility Circles',
    description:
      'Improve ankle range of motion with controlled circular movements. ' +
      'Perform 10 circles in each direction per ankle. Useful for post-ankle injury rehabilitation.',
    s3Key: 'library/77777777-7777-7777-8777-777777770008.mp4',

    durationSeconds: 150,
    fileSizeBytes: 35_000_000,
    mimeType: 'video/mp4',
    status: 'active',
    difficulty: 'beginner',
    equipment: ['chair'],
    videoTags: { movement: ['mobility'], 'body-area': ['ankles', 'calves'] },
  },
  {
    id: VIDEO_IDS['glute-bridge'],
    title: 'Glute Bridge with Hold',
    description:
      'An advanced glute bridge variation with a 3-second hold at the top. ' +
      'Targets the glutes and hamstrings while engaging the core. Perform 3 sets of 12 reps.',
    s3Key: 'library/77777777-7777-7777-8777-777777770009.mp4',

    durationSeconds: 270,
    fileSizeBytes: 68_000_000,
    mimeType: 'video/mp4',
    status: 'active',
    difficulty: 'advanced',
    equipment: ['yoga_mat'],
    defaultSets: 3,
    defaultReps: '12',
    defaultRestSeconds: 30,
    defaultNotes: 'Pause for two seconds at the top.',
    videoTags: { movement: ['strength'], 'body-area': ['glutes', 'hamstrings', 'core'] },
  },
  {
    id: VIDEO_IDS['draft-shoulder-press'],
    title: 'Resistance Band Shoulder Press',
    description:
      'An overhead pressing exercise using a resistance band. Currently in review — ' +
      'awaiting final filming approval before publishing to the catalogue.',
    s3Key: 'library/77777777-7777-7777-8777-777777770010.mp4',

    durationSeconds: 250,
    fileSizeBytes: 65_000_000,
    mimeType: 'video/mp4',
    status: 'draft',
    difficulty: 'intermediate',
    equipment: ['resistance_band'],
    videoTags: { movement: ['strength'], 'body-area': ['shoulders', 'triceps'] },
  },
];

/** Where each seeded video's media is expected in the videos bucket (see `seedVideoAssets`) */
export const SEED_VIDEO_S3_KEYS: string[] = DEFAULT_VIDEOS.map((video) => video.s3Key);

/**
 * Tags every seed video, new or existing, skipping assignments already made. The tags
 * themselves are created by the migration.
 */
const seedVideoTags = async (db: NodePgDatabase<typeof schema>): Promise<number> => {
  const tagRows = await db
    .select({ id: tags.id, categorySlug: tagCategories.slug, tagSlug: tags.slug })
    .from(tags)
    .innerJoin(tagCategories, eq(tagCategories.id, tags.categoryId));
  const tagIds = new Map(tagRows.map((row) => [`${row.categorySlug}/${row.tagSlug}`, row.id]));

  const assignments = DEFAULT_VIDEOS.flatMap((video) =>
    Object.entries(video.videoTags).flatMap(([categorySlug, tagSlugs]) =>
      tagSlugs.map((tagSlug) => {
        const tagId = tagIds.get(`${categorySlug}/${tagSlug}`);

        if (!tagId) {
          throw new Error(
            `Seed tag not found: ${categorySlug}/${tagSlug} — has the database been migrated?`
          );
        }

        return { videoId: requireSeedId(video, `video "${video.title}"`), tagId };
      })
    )
  );

  const inserted = await db
    .insert(videoTags)
    .values(assignments)
    .onConflictDoNothing()
    .returning({ id: videoTags.id });

  return inserted.length;
};

const hasDefaults = (video: SeedVideo): boolean =>
  [
    video.defaultSets,
    video.defaultReps,
    video.defaultDurationSeconds,
    video.defaultRestSeconds,
    video.defaultNotes,
  ].some((value) => value != null);

/**
 * Gives an existing seed video its prescription defaults when it has none at all, so the
 * defaults reach a database seeded before they existed without overwriting an admin's edits.
 */
const backfillVideoDefaults = async (
  db: NodePgDatabase<typeof schema>,
  video: SeedVideo
): Promise<boolean> => {
  const updated = await db
    .update(videos)
    .set({
      defaultSets: video.defaultSets,
      defaultReps: video.defaultReps,
      defaultDurationSeconds: video.defaultDurationSeconds,
      defaultRestSeconds: video.defaultRestSeconds,
      defaultNotes: video.defaultNotes,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(videos.id, requireSeedId(video, `video "${video.title}"`)),
        isNull(videos.defaultSets),
        isNull(videos.defaultReps),
        isNull(videos.defaultDurationSeconds),
        isNull(videos.defaultRestSeconds),
        isNull(videos.defaultNotes)
      )
    )
    .returning({ id: videos.id });

  return updated.length > 0;
};

/**
 * Seeds exercise videos for the video catalogue.
 *
 * This seed is IDEMPOTENT — safe to run multiple times.
 * Videos are checked by ID before inserting (existing videos are skipped, apart from
 * prescription defaults on a video that has none).
 *
 * Note: videos table has NO RLS (system-managed catalogue),
 * so no special context needed.
 *
 * @param db - Database client with schema
 * @returns Promise<number> - Number of videos created (0 if all existed)
 */
export const seedVideos = async (
  db: NodePgDatabase<typeof schema> & { $client: Pool }
): Promise<number> => {
  logger.info('Seeding videos...');

  let createdCount = 0;
  let defaultsBackfilled = 0;

  for (const video of DEFAULT_VIDEOS) {
    // Check if video already exists (idempotency check by ID)
    const existingVideo = await db.query.videos.findFirst({
      where: eq(videos.id, requireSeedId(video, `video "${video.title}"`)),
    });

    if (existingVideo) {
      logger.warn(`Video already exists: "${video.title}"`);

      if (hasDefaults(video) && (await backfillVideoDefaults(db, video))) {
        defaultsBackfilled++;
      }

      continue;
    }

    const { videoTags: _videoTags, ...record } = video;
    const [newVideo] = await db.insert(videos).values(record).returning({
      id: videos.id,
      title: videos.title,
      status: videos.status,
    });

    logger.info('Video created', {
      id: newVideo.id,
      title: newVideo.title,
      status: newVideo.status,
    });

    createdCount++;
  }

  const tagsAssigned = await seedVideoTags(db);

  logger.info('Videos seed complete', {
    created: createdCount,
    alreadyExisted: DEFAULT_VIDEOS.length - createdCount,
    defaultsBackfilled,
    tagsAssigned,
  });

  return createdCount;
};
