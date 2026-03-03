import { Pool } from 'pg';
import { eq } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../src/schema/index.js';
import { videos } from '../src/schema/index.js';
import { createLogger } from '../src/lib/logger.js';

import type { NewVideo } from '../src/schema/videos.js';

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

export type VideoSlug = keyof typeof VIDEO_IDS;

/**
 * Seed video definitions — realistic exercise video catalogue entries
 *
 * Covers a variety of:
 * - Difficulties: beginner, intermediate, advanced
 * - Movement types: stretch, strength, mobility, balance
 * - Body parts: various muscle groups and areas
 * - Equipment: none, resistance_band, yoga_mat, chair
 * - Statuses: mostly active, one draft for testing
 */
const DEFAULT_VIDEOS: NewVideo[] = [
  {
    id: VIDEO_IDS['seated-hamstring-stretch'],
    title: 'Seated Hamstring Stretch',
    description:
      'A gentle seated stretch targeting the hamstrings. Ideal for users with limited mobility ' +
      'or those recovering from lower back issues. Perform slowly and hold for 20-30 seconds each side.',
    s3Key: 'library/77777777-7777-7777-8777-777777770001.mp4',
    thumbnailKey: 'thumbnails/77777777-7777-7777-8777-777777770001.jpg',
    durationSeconds: 180,
    fileSizeBytes: 45_000_000,
    mimeType: 'video/mp4',
    status: 'active',
    difficulty: 'beginner',
    movementType: 'stretch',
    bodyParts: ['hamstrings', 'lower_back'],
    equipment: ['chair'],
    tags: ['post-surgery', 'gentle', 'seated'],
  },
  {
    id: VIDEO_IDS['standing-quad-stretch'],
    title: 'Standing Quad Stretch',
    description:
      'A standing quadriceps stretch with optional wall support for balance. ' +
      'Hold each side for 20-30 seconds, focusing on keeping the knees together.',
    s3Key: 'library/77777777-7777-7777-8777-777777770002.mp4',
    thumbnailKey: 'thumbnails/77777777-7777-7777-8777-777777770002.jpg',
    durationSeconds: 150,
    fileSizeBytes: 38_000_000,
    mimeType: 'video/mp4',
    status: 'active',
    difficulty: 'beginner',
    movementType: 'stretch',
    bodyParts: ['quadriceps', 'hip_flexors'],
    equipment: ['none'],
    tags: ['standing', 'warm-up'],
  },
  {
    id: VIDEO_IDS['resistance-band-row'],
    title: 'Resistance Band Seated Row',
    description:
      'Strengthen the upper back and improve posture with this seated resistance band row. ' +
      'Perform 3 sets of 10-12 repetitions with controlled movement.',
    s3Key: 'library/77777777-7777-7777-8777-777777770003.mp4',
    thumbnailKey: 'thumbnails/77777777-7777-7777-8777-777777770003.jpg',
    durationSeconds: 240,
    fileSizeBytes: 62_000_000,
    mimeType: 'video/mp4',
    status: 'active',
    difficulty: 'intermediate',
    movementType: 'strength',
    bodyParts: ['upper_back', 'shoulders', 'biceps'],
    equipment: ['resistance_band'],
    tags: ['posture', 'upper-body'],
  },
  {
    id: VIDEO_IDS['bodyweight-squat'],
    title: 'Bodyweight Squat',
    description:
      'A fundamental lower-body strength exercise. Focus on proper form: chest up, ' +
      'knees tracking over toes, and sitting back into the heels. Perform 3 sets of 12-15 reps.',
    s3Key: 'library/77777777-7777-7777-8777-777777770004.mp4',
    thumbnailKey: 'thumbnails/77777777-7777-7777-8777-777777770004.jpg',
    durationSeconds: 300,
    fileSizeBytes: 78_000_000,
    mimeType: 'video/mp4',
    status: 'active',
    difficulty: 'intermediate',
    movementType: 'strength',
    bodyParts: ['quadriceps', 'glutes', 'hamstrings'],
    equipment: ['none'],
    tags: ['compound', 'lower-body', 'functional'],
  },
  {
    id: VIDEO_IDS['single-leg-balance'],
    title: 'Single Leg Balance Hold',
    description:
      'Improve proprioception and ankle stability with this single-leg balance exercise. ' +
      'Hold for 30 seconds each side. Progress by closing your eyes or standing on an uneven surface.',
    s3Key: 'library/77777777-7777-7777-8777-777777770005.mp4',
    thumbnailKey: 'thumbnails/77777777-7777-7777-8777-777777770005.jpg',
    durationSeconds: 120,
    fileSizeBytes: 30_000_000,
    mimeType: 'video/mp4',
    status: 'active',
    difficulty: 'beginner',
    movementType: 'balance',
    bodyParts: ['ankles', 'calves', 'core'],
    equipment: ['none'],
    tags: ['balance', 'proprioception', 'fall-prevention'],
  },
  {
    id: VIDEO_IDS['cat-cow-stretch'],
    title: 'Cat-Cow Spinal Mobilisation',
    description:
      'A gentle spinal mobilisation exercise performed on all fours. Alternate between ' +
      'arching and rounding the back, synchronising with your breath. Perform 10-12 repetitions.',
    s3Key: 'library/77777777-7777-7777-8777-777777770006.mp4',
    thumbnailKey: 'thumbnails/77777777-7777-7777-8777-777777770006.jpg',
    durationSeconds: 200,
    fileSizeBytes: 52_000_000,
    mimeType: 'video/mp4',
    status: 'active',
    difficulty: 'beginner',
    movementType: 'mobility',
    bodyParts: ['spine', 'core', 'lower_back'],
    equipment: ['yoga_mat'],
    tags: ['spinal', 'warm-up', 'gentle'],
  },
  {
    id: VIDEO_IDS['wall-push-up'],
    title: 'Wall Push-Up',
    description:
      'A modified push-up using a wall for support, suitable for beginners or those building ' +
      'upper-body strength. Perform 3 sets of 10-15 reps with a controlled tempo.',
    s3Key: 'library/77777777-7777-7777-8777-777777770007.mp4',
    thumbnailKey: 'thumbnails/77777777-7777-7777-8777-777777770007.jpg',
    durationSeconds: 210,
    fileSizeBytes: 55_000_000,
    mimeType: 'video/mp4',
    status: 'active',
    difficulty: 'beginner',
    movementType: 'strength',
    bodyParts: ['chest', 'shoulders', 'triceps'],
    equipment: ['none'],
    tags: ['upper-body', 'modified', 'beginner-friendly'],
  },
  {
    id: VIDEO_IDS['ankle-mobility-circles'],
    title: 'Ankle Mobility Circles',
    description:
      'Improve ankle range of motion with controlled circular movements. ' +
      'Perform 10 circles in each direction per ankle. Useful for post-ankle injury rehabilitation.',
    s3Key: 'library/77777777-7777-7777-8777-777777770008.mp4',
    thumbnailKey: 'thumbnails/77777777-7777-7777-8777-777777770008.jpg',
    durationSeconds: 150,
    fileSizeBytes: 35_000_000,
    mimeType: 'video/mp4',
    status: 'active',
    difficulty: 'beginner',
    movementType: 'mobility',
    bodyParts: ['ankles', 'calves'],
    equipment: ['chair'],
    tags: ['rehabilitation', 'ankle', 'mobility'],
  },
  {
    id: VIDEO_IDS['glute-bridge'],
    title: 'Glute Bridge with Hold',
    description:
      'An advanced glute bridge variation with a 3-second hold at the top. ' +
      'Targets the glutes and hamstrings while engaging the core. Perform 3 sets of 12 reps.',
    s3Key: 'library/77777777-7777-7777-8777-777777770009.mp4',
    thumbnailKey: 'thumbnails/77777777-7777-7777-8777-777777770009.jpg',
    durationSeconds: 270,
    fileSizeBytes: 68_000_000,
    mimeType: 'video/mp4',
    status: 'active',
    difficulty: 'advanced',
    movementType: 'strength',
    bodyParts: ['glutes', 'hamstrings', 'core'],
    equipment: ['yoga_mat'],
    tags: ['glutes', 'posterior-chain', 'progressive'],
  },
  {
    id: VIDEO_IDS['draft-shoulder-press'],
    title: 'Resistance Band Shoulder Press',
    description:
      'An overhead pressing exercise using a resistance band. Currently in review — ' +
      'awaiting final filming approval before publishing to the catalogue.',
    s3Key: 'library/77777777-7777-7777-8777-777777770010.mp4',
    thumbnailKey: null,
    durationSeconds: 250,
    fileSizeBytes: 65_000_000,
    mimeType: 'video/mp4',
    status: 'draft',
    difficulty: 'intermediate',
    movementType: 'strength',
    bodyParts: ['shoulders', 'triceps'],
    equipment: ['resistance_band'],
    tags: ['upper-body', 'overhead'],
  },
];

/**
 * Seeds exercise videos for the video catalogue.
 *
 * This seed is IDEMPOTENT — safe to run multiple times.
 * Videos are checked by ID before inserting (existing videos are skipped).
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

  for (const video of DEFAULT_VIDEOS) {
    // Check if video already exists (idempotency check by ID)
    const existingVideo = await db.query.videos.findFirst({
      where: eq(videos.id, video.id!),
    });

    if (existingVideo) {
      logger.warn(`Video already exists: "${video.title}"`);
      continue;
    }

    // Insert new video
    const [newVideo] = await db.insert(videos).values(video).returning({
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

  logger.info('Videos seed complete', {
    created: createdCount,
    alreadyExisted: DEFAULT_VIDEOS.length - createdCount,
  });

  return createdCount;
};
