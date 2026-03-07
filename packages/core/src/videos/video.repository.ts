import { and, eq, arrayOverlaps, type SQL } from 'drizzle-orm';

import type { DbClient } from '@ffp/database';
import type { Difficulty, MovementType } from '@ffp/database/constants';
import { videos, type VideoRecord, type NewVideo } from '@ffp/database/schema';

export interface VideoFilters {
  /** Filter by target body parts — matches videos that overlap with any of the provided values */
  bodyParts?: string[];
  /** Filter by required equipment — matches videos that overlap with any of the provided values */
  equipment?: string[];
  /** Filter by exercise difficulty level */
  difficulty?: Difficulty;
  /** Filter by movement type category */
  movementType?: MovementType;
  /** Filter by tags — matches videos that overlap with any of the provided values */
  tags?: string[];
}

export async function insertVideo(db: DbClient, input: NewVideo): Promise<VideoRecord> {
  const records = await db.insert(videos).values(input).returning();

  return records[0];
}

export async function findVideoById(db: DbClient, videoId: string): Promise<VideoRecord | null> {
  const records = await db.select().from(videos).where(eq(videos.id, videoId)).limit(1);

  return records[0] ?? null;
}

export async function findAllActive(db: DbClient): Promise<VideoRecord[]> {
  return await db.select().from(videos).where(eq(videos.status, 'active')).orderBy(videos.title);
}

/**
 * Returns active videos matching the provided filter criteria.
 * Array filters (bodyParts, equipment, tags) use GIN-indexed arrayOverlaps for performance.
 */
export async function findByFilters(db: DbClient, filters: VideoFilters): Promise<VideoRecord[]> {
  const conditions: SQL[] = [eq(videos.status, 'active')];

  if (filters.bodyParts && filters.bodyParts.length > 0) {
    conditions.push(arrayOverlaps(videos.bodyParts, filters.bodyParts));
  }

  if (filters.equipment && filters.equipment.length > 0) {
    conditions.push(arrayOverlaps(videos.equipment, filters.equipment));
  }

  if (filters.difficulty) {
    conditions.push(eq(videos.difficulty, filters.difficulty));
  }

  if (filters.movementType) {
    conditions.push(eq(videos.movementType, filters.movementType));
  }

  if (filters.tags && filters.tags.length > 0) {
    conditions.push(arrayOverlaps(videos.tags, filters.tags));
  }

  return await db
    .select()
    .from(videos)
    .where(and(...conditions))
    .orderBy(videos.title);
}
