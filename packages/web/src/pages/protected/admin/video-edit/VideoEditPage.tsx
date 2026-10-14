import React, { useCallback, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import type { UpdateVideoInput } from '@ffp/core';

import { AdminEditPageShell } from '@web/components/templates';
import { ArchiveVideoModal, VideoMetadataFormFields } from '@web/components/video';
import { VideoPlayer } from '@web/components/video/VideoPlayer';
import { VideoReplacer } from '@web/components/video/VideoReplacer';
import { useSaveFeedback } from '@web/hooks/useSaveFeedback';
import { useUpdateVideoMutation, useVideoQuery } from '@web/hooks/videos';
import { RouteKey, routes } from '@web/pages/routes';

import { toUpdateVideoInput, toVideoFormValues } from './video-form-values';

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
      const payload = video ? toUpdateVideoInput(values, video) : {};

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
    [video, executeUpdate, handleNavigateBack]
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
        <VideoMetadataFormFields
          variant="edit"
          currentStatus={video.status}
          onCancel={handleNavigateBack}
          isSubmitting={updateMutation.isPending}
          errorMessage={submitError}
          submitLabel="Save Changes"
          cancelDisabled={updateMutation.isPending}
        />
      )}
    </AdminEditPageShell>
  );
};
