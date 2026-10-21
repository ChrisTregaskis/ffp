import { randomUUID } from 'crypto';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import type * as ffpDatabase from '@ffp/database';
import { TAG_CATEGORY_SLUGS } from '@ffp/database/constants';
import type { VideoRecord } from '@ffp/database/schema';

import { createSystemContext } from '../../src/lib/context';
import * as videoTagService from '../../src/tags/video-tag.service';
import * as videoStorage from '../../src/videos/video-upload.service';
import * as videoRepository from '../../src/videos/video.repository';
import { updateVideo } from '../../src/videos/video.service';

import type { VideoTags } from '../../src/schemas/tag.schema';

vi.mock('../../src/videos/video.repository');
vi.mock('../../src/tags/video-tag.service');
vi.mock('../../src/videos/video-upload.service');

// The transaction runs its work against a stand-in client; a test makes it throw to fail the update
const transaction = vi.hoisted(() => vi.fn());

vi.mock('@ffp/database', async (importOriginal) => ({
  ...(await importOriginal<typeof ffpDatabase>()),
  getDb: () => ({ transaction }),
}));

const mockedRepository = vi.mocked(videoRepository);
const mockedStorage = vi.mocked(videoStorage);

const ctx = createSystemContext({ systemId: 'video-replace-test', organisationId: 'org-test' });

const OLD_KEY = `library/${randomUUID()}.mp4`;
const NEW_KEY = `library/${randomUUID()}.mp4`;

const buildVideo = (overrides: Partial<VideoRecord> = {}): VideoRecord =>
  ({
    id: randomUUID(),
    publicId: 'vidABCDE1234',
    title: 'Seated Hamstring Stretch',
    description: null,
    s3Key: OLD_KEY,
    durationSeconds: 30,
    fileSizeBytes: 1024,
    mimeType: 'video/mp4',
    status: 'active',
    difficulty: null,
    equipment: [],
    isEssential: false,
    defaultSets: null,
    defaultReps: null,
    defaultDurationSeconds: null,
    defaultRestSeconds: null,
    defaultNotes: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }) as VideoRecord;

interface LogLine {
  level: string;
  message: string;
  context?: Record<string, unknown>;
}

/** Every structured log line written during the test */
const logLines = (): LogLine[] =>
  vi.mocked(console.log).mock.calls.map(([line]) => JSON.parse(String(line)) as LogLine);

describe('Replacing a video file', () => {
  const existing = buildVideo();
  let committed: boolean;

  beforeEach(() => {
    vi.resetAllMocks();
    vi.spyOn(console, 'log').mockImplementation(() => undefined);

    committed = false;
    transaction.mockImplementation(async (work: (tx: unknown) => Promise<unknown>) => {
      const result = await work({});
      committed = true;

      return result;
    });
    mockedRepository.findVideoByPublicId.mockResolvedValue(existing);
    mockedRepository.updateVideo.mockImplementation((_tx, _id, input) =>
      Promise.resolve(buildVideo({ ...existing, ...input } as Partial<VideoRecord>))
    );
    vi.mocked(videoTagService.findTagsOfVideo).mockResolvedValue(
      Object.fromEntries(TAG_CATEGORY_SLUGS.map((slug) => [slug, []])) as VideoTags
    );
    mockedStorage.deleteVideoObject.mockResolvedValue();
  });

  it('deletes the old file once the new key has been saved', async () => {
    mockedStorage.deleteVideoObject.mockImplementation(() => {
      // The record must already point at the new file when the old one goes
      expect(committed).toBe(true);

      return Promise.resolve();
    });

    await updateVideo(ctx, existing.publicId, { s3Key: NEW_KEY, durationSeconds: 45 });

    expect(mockedStorage.deleteVideoObject).toHaveBeenCalledExactlyOnceWith(OLD_KEY);
  });

  it('logs the replaced key so a replace can be traced', async () => {
    await updateVideo(ctx, existing.publicId, { s3Key: NEW_KEY });

    expect(logLines()).toContainEqual(
      expect.objectContaining({
        level: 'INFO',
        message: 'Replaced video file deleted',
        context: expect.objectContaining({ replacedS3Key: OLD_KEY, s3Key: NEW_KEY }) as unknown,
      })
    );
  });

  it('keeps the live file when the update fails', async () => {
    transaction.mockRejectedValue(new Error('connection lost'));

    await expect(updateVideo(ctx, existing.publicId, { s3Key: NEW_KEY })).rejects.toThrow(
      'connection lost'
    );

    expect(mockedStorage.deleteVideoObject).not.toHaveBeenCalled();
  });

  it('keeps the live file when the tag write rolls the update back', async () => {
    vi.mocked(videoTagService.writeTagAssignment).mockRejectedValue(new Error('tag write failed'));

    await expect(updateVideo(ctx, existing.publicId, { s3Key: NEW_KEY })).rejects.toThrow(
      'tag write failed'
    );

    expect(mockedStorage.deleteVideoObject).not.toHaveBeenCalled();
  });

  it('refuses a key no upload issued, and deletes nothing', async () => {
    await expect(
      updateVideo(ctx, existing.publicId, { s3Key: 'library/placeholder.mp4' })
    ).rejects.toThrow();

    expect(mockedRepository.updateVideo).not.toHaveBeenCalled();
    expect(mockedStorage.deleteVideoObject).not.toHaveBeenCalled();
  });

  it('deletes nothing when the key is unchanged or not sent', async () => {
    await updateVideo(ctx, existing.publicId, { s3Key: OLD_KEY });
    await updateVideo(ctx, existing.publicId, { title: 'Standing Calf Raise' });

    expect(mockedStorage.deleteVideoObject).not.toHaveBeenCalled();
  });

  it('still succeeds when the delete fails, and logs the orphaned key', async () => {
    mockedStorage.deleteVideoObject.mockRejectedValue(new Error('AccessDenied'));

    const video = await updateVideo(ctx, existing.publicId, { s3Key: NEW_KEY });

    expect(video.publicId).toBe(existing.publicId);
    expect(logLines()).toContainEqual(
      expect.objectContaining({
        level: 'ERROR',
        message: 'Replaced video file could not be deleted',
        context: expect.objectContaining({
          replacedS3Key: OLD_KEY,
          error: 'AccessDenied',
        }) as unknown,
      })
    );
  });
});
