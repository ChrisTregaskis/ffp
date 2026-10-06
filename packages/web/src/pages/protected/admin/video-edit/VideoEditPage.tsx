import React, { useCallback, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import type { UpdateVideoInput, VideoStatus } from '@ffp/core';

import { AdminEditPageShell } from '@web/components/templates';
import { ArchiveVideoModal } from '@web/components/video';
import { VideoPlayer } from '@web/components/video/VideoPlayer';
import { VideoReplacer } from '@web/components/video/VideoReplacer';
import { useSaveFeedback } from '@web/hooks/useSaveFeedback';
import { useUpdateVideoMutation, useVideoQuery } from '@web/hooks/videos';
import { RouteKey, routes } from '@web/pages/routes';
import { fieldToNumber } from '@web/utils/form-number';

import { toVideoFormValues } from './video-form-values';
import { VideoEditFormFields } from './VideoEditFormFields';

import type { VideoEditFormValues } from './types';

/** An archive awaiting confirmation, with the settlers of the promise the form is awaiting */
interface PendingArchive {
  payload: UpdateVideoInput;
  resolve: () => void;
  reject: (reason: Error) => void;
}

export const VideoEditPage: React.FC = () => {
  const { id = '' } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { submitError, clearSubmitError, saveCallbacks } = useSaveFeedback();

  const { data: video, isLoading, error } = useVideoQuery(id, { includeInactive: true });
  const updateMutation = useUpdateVideoMutation();

  const pendingArchiveRef = useRef<PendingArchive | null>(null);
  const [isArchiveConfirmOpen, setIsArchiveConfirmOpen] = useState(false);

  const handleNavigateBack = useCallback(() => {
    void navigate(routes[RouteKey.ADMIN_VIDEOS].path);
  }, [navigate]);

  /** Build the UpdateVideoInput from form values, only including changed fields */
  const buildUpdatePayload = useCallback(
    (values: VideoEditFormValues): UpdateVideoInput => {
      const payload: UpdateVideoInput = {};

      if (!video) {
        return payload;
      }

      if (values.title !== video.title) {
        payload.title = values.title;
      }

      const descValue = values.description || null;

      if (descValue !== (video.description ?? null)) {
        payload.description = descValue;
      }

      const movementValue = values.movementType || null;

      if (movementValue !== (video.movementType ?? null)) {
        payload.movementType = movementValue as UpdateVideoInput['movementType'];
      }

      const diffValue = values.difficulty || null;

      if (diffValue !== (video.difficulty ?? null)) {
        payload.difficulty = diffValue as UpdateVideoInput['difficulty'];
      }

      if (values.status !== video.status) {
        payload.status = values.status as VideoStatus;
      }

      // Arrays — compare by content
      const arraysEqual = (a: string[], b: string[]): boolean =>
        a.length === b.length && a.every((v, i) => v === b[i]);

      if (!arraysEqual(values.bodyParts, video.bodyParts)) {
        payload.bodyParts = values.bodyParts;
      }

      if (!arraysEqual(values.equipment, video.equipment)) {
        payload.equipment = values.equipment;
      }

      if (!arraysEqual(values.tags, video.tags)) {
        payload.tags = values.tags;
      }

      // A blank prescription field clears the stored value, which takes null rather than undefined
      const toNumberOrNull = (val: string): number | null => fieldToNumber(val) ?? null;
      const toStringOrNull = (val: string): string | null => val || null;

      const newSets = toNumberOrNull(values.defaultSets);

      if (newSets !== (video.defaultSets ?? null)) {
        payload.defaultSets = newSets;
      }

      const newReps = toStringOrNull(values.defaultReps);

      if (newReps !== (video.defaultReps ?? null)) {
        payload.defaultReps = newReps;
      }

      const newDuration = toNumberOrNull(values.defaultDurationSeconds);

      if (newDuration !== (video.defaultDurationSeconds ?? null)) {
        payload.defaultDurationSeconds = newDuration;
      }

      const newRest = toNumberOrNull(values.defaultRestSeconds);

      if (newRest !== (video.defaultRestSeconds ?? null)) {
        payload.defaultRestSeconds = newRest;
      }

      const newNotes = toStringOrNull(values.defaultNotes);

      if (newNotes !== (video.defaultNotes ?? null)) {
        payload.defaultNotes = newNotes;
      }

      return payload;
    },
    [video]
  );

  /** Execute the update mutation */
  const executeUpdate = useCallback(
    async (data: UpdateVideoInput): Promise<void> => {
      if (!video) {
        return;
      }

      clearSubmitError();

      await updateMutation.mutateAsync(
        { id: video.id, publicId: video.publicId, data },
        saveCallbacks('Video updated successfully', handleNavigateBack)
      );
    },
    [video, clearSubmitError, updateMutation, saveCallbacks, handleNavigateBack]
  );

  /**
   * Handle form submission — an archive waits for confirmation. Its promise settles from the
   * modal rather than when the modal opens, so an opened modal never reads as a landed save.
   */
  const handleUpdate = useCallback(
    async (values: VideoEditFormValues): Promise<void> => {
      const payload = buildUpdatePayload(values);

      if (Object.keys(payload).length === 0) {
        handleNavigateBack();

        return;
      }

      if (payload.status === 'archived') {
        await new Promise<void>((resolve, reject) => {
          pendingArchiveRef.current = { payload, resolve, reject };
          setIsArchiveConfirmOpen(true);
        });

        return;
      }

      await executeUpdate(payload);
    },
    [buildUpdatePayload, executeUpdate, handleNavigateBack]
  );

  // Taken rather than read, so a click landing during the modal's exit animation settles nothing
  const takePendingArchive = useCallback((): PendingArchive | null => {
    const pending = pendingArchiveRef.current;
    pendingArchiveRef.current = null;
    setIsArchiveConfirmOpen(false);

    return pending;
  }, []);

  const handleConfirmArchive = useCallback(() => {
    const pending = takePendingArchive();

    if (pending) {
      executeUpdate(pending.payload).then(pending.resolve, pending.reject);
    }
  }, [takePendingArchive, executeUpdate]);

  const handleCancelArchive = useCallback(() => {
    takePendingArchive()?.reject(new Error('Archive cancelled'));
  }, [takePendingArchive]);

  return (
    <AdminEditPageShell
      title="Edit Video"
      resourceLabel="video"
      listLabel="Video Library"
      isLoading={isLoading}
      loadError={error}
      onBack={handleNavigateBack}
      record={video}
      toFormValues={toVideoFormValues}
      onUpdate={handleUpdate}
      beforeForm={
        video && (
          <>
            <VideoPlayer
              videoId={id}
              ariaLabel={`Preview of ${video.title}`}
              variant="white"
              className="mb-4"
            />
            <VideoReplacer videoId={video.id} publicId={id} className="mb-6" />
          </>
        )
      }
      footer={
        <ArchiveVideoModal
          isOpen={isArchiveConfirmOpen}
          onClose={handleCancelArchive}
          onConfirm={handleConfirmArchive}
          isLoading={updateMutation.isPending}
        />
      }
    >
      {video && (
        <VideoEditFormFields
          currentStatus={video.status}
          onCancel={handleNavigateBack}
          isSubmitting={updateMutation.isPending}
          errorMessage={submitError}
        />
      )}
    </AdminEditPageShell>
  );
};
