import React, { useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { AdminEditPageShell } from '@web/components/templates';
import { ArchiveVideoModal, VideoMetadataFormFields } from '@web/components/video';
import { VideoPlayer } from '@web/components/video/VideoPlayer';
import { VideoReplacer } from '@web/components/video/VideoReplacer';
import { RouteKey, routes } from '@web/config/routes';
import { useSaveFeedback } from '@web/hooks/useSaveFeedback';
import { useAdminVideoQuery, useUpdateVideoMutation } from '@web/hooks/videos';

import { archivesVideo, toUpdateVideoInput, toVideoFormValues } from './video-form-values';

import type { VideoEditFormValues } from './types';

export const VideoEditPage: React.FC = () => {
  const { id = '' } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { submitError, clearSubmitError, saveCallbacks } = useSaveFeedback();

  const { data: video, isLoading, error } = useAdminVideoQuery(id);
  const updateMutation = useUpdateVideoMutation();

  const handleNavigateBack = useCallback(() => {
    void navigate(routes[RouteKey.ADMIN_VIDEOS].path);
  }, [navigate]);

  /** Handle form submission; an archive waits for the shell's confirm */
  const handleUpdate = useCallback(
    async (values: VideoEditFormValues): Promise<void> => {
      if (!video) {
        return;
      }

      const payload = toUpdateVideoInput(values, video);

      if (Object.keys(payload).length === 0) {
        handleNavigateBack();

        return;
      }

      clearSubmitError();

      await updateMutation.mutateAsync(
        { publicId: video.publicId, data: payload },
        saveCallbacks('Video updated successfully', handleNavigateBack)
      );
    },
    [video, clearSubmitError, updateMutation, saveCallbacks, handleNavigateBack]
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
            <VideoReplacer publicId={id} className="mb-6" />
          </>
        )
      }
      confirmBeforeSave={{
        when: archivesVideo,
        renderModal: (modalProps) => <ArchiveVideoModal {...modalProps} />,
      }}
    >
      {video && (
        <VideoMetadataFormFields
          variant="edit"
          currentStatus={video.status}
          carriedTagIds={Object.values(video.tags).flatMap((tags) =>
            tags.map((tag) => tag.publicId)
          )}
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
