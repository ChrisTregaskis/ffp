import React, { useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import type { UpdateVideoInput } from '@ffp/core';

import { AdminEditPageShell } from '@web/components/templates';
import { ArchiveVideoModal, VideoMetadataFormFields } from '@web/components/video';
import { VideoPlayer } from '@web/components/video/VideoPlayer';
import { VideoReplacer } from '@web/components/video/VideoReplacer';
import { RouteKey, routes } from '@web/config/routes';
import { useConfirmBeforeSave } from '@web/hooks/useConfirmBeforeSave';
import { useSaveFeedback } from '@web/hooks/useSaveFeedback';
import { useUpdateVideoMutation, useVideoQuery } from '@web/hooks/videos';

import { toUpdateVideoInput, toVideoFormValues } from './video-form-values';

import type { VideoEditFormValues } from './types';

export const VideoEditPage: React.FC = () => {
  const { id = '' } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { submitError, clearSubmitError, saveCallbacks } = useSaveFeedback();

  const { data: video, isLoading, error } = useVideoQuery(id, { includeInactive: true });
  const updateMutation = useUpdateVideoMutation();

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

  const archiveConfirm = useConfirmBeforeSave(executeUpdate);
  const { requestConfirm: requestArchiveConfirm } = archiveConfirm;

  /** Handle form submission — an archive waits for confirmation */
  const handleUpdate = useCallback(
    async (values: VideoEditFormValues): Promise<void> => {
      const payload = video ? toUpdateVideoInput(values, video) : {};

      if (Object.keys(payload).length === 0) {
        handleNavigateBack();

        return;
      }

      if (payload.status === 'archived') {
        await requestArchiveConfirm(payload);

        return;
      }

      await executeUpdate(payload);
    },
    [video, executeUpdate, requestArchiveConfirm, handleNavigateBack]
  );

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
          isOpen={archiveConfirm.isConfirmOpen}
          onClose={archiveConfirm.cancel}
          onConfirm={archiveConfirm.confirm}
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
