import { eq } from 'drizzle-orm';

import type { DbClient } from '@ffp/database';
import { videos, type VideoRecord } from '@ffp/database/schema';

export async function findVideoById(db: DbClient, videoId: string): Promise<VideoRecord | null> {
  const records = await db.select().from(videos).where(eq(videos.id, videoId)).limit(1);

  return records[0] ?? null;
}
