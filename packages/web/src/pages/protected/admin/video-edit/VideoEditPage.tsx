import React, { useCallback, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import type { UpdateVideoInput, VideoStatus } from '@ffp/core';

import { PageState } from '@web/components/feedback/PageState';
import { ComposableForm } from '@web/components/form/composableForm';
import { ContentPanel, PageContainer, PageHeader } from '@web/components/layout';
import { ArchiveVideoModal } from '@web/components/modal';
import { VideoPlayer } from '@web/components/video/VideoPlayer';
import { VideoReplacer } from '@web/components/video/VideoReplacer';
import { useSaveFeedback } from '@web/hooks/useSaveFeedback';
import { useUpdateVideoMutation, useVideoQuery } from '@web/hooks/videos';
import { RouteKey, routes } from '@web/pages/routes';
import { fieldToNumber, numberToField } from '@web/utils/form-number';

import { VideoEditFormFields } from './VideoEditFormFields';

import type { VideoEditFormValues } from './types';

export const VideoEditPage: React.FC = () => {
  const { id = '' } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { submitError, clearSubmitError, saveCallbacks } = useSaveFeedback();

  const { data: video, isLoading, error } = useVideoQuery(id, { includeInactive: true });
  const updateMutation = useUpdateVideoMutation();

  const [showArchiveConfirm, setShowArchiveConfirm] = useState(false);
  const [pendingSubmitData, setPendingSubmitData] = useState<UpdateVideoInput | null>(null);

  /** Form values from video data */
  const formValues = useMemo((): VideoEditFormValues | undefined => {
    if (!video) {
      return undefined;
    }

    return {
      title: video.title,
      description: video.description ?? '',
      movementType: video.movementType ?? '',
      difficulty: video.difficulty ?? '',
      status: video.status,
      bodyParts: video.bodyParts,
      equipment: video.equipment,
      tags: video.tags,
      defaultSets: numberToField(video.defaultSets),
      defaultReps: video.defaultReps ?? '',
      defaultDurationSeconds: numberToField(video.defaultDurationSeconds),
      defaultRestSeconds: numberToField(video.defaultRestSeconds),
      defaultNotes: video.defaultNotes ?? '',
    };
  }, [video]);

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
   * Handle form submission — intercept archive transitions for confirmation. Returns a
   * promise only when a save starts, so the form never treats an opened modal as saved.
   */
  const handleFormSubmit = useCallback(
    (values: VideoEditFormValues): Promise<void> | undefined => {
      const payload = buildUpdatePayload(values);

      // If no changes, just navigate back
      if (Object.keys(payload).length === 0) {
        handleNavigateBack();

        return undefined;
      }

      // If archiving, show confirmation dialog
      if (payload.status === 'archived') {
        setPendingSubmitData(payload);
        setShowArchiveConfirm(true);

        return undefined;
      }

      return executeUpdate(payload);
    },
    [buildUpdatePayload, executeUpdate, handleNavigateBack]
  );

  /** Confirm archiving after dialog */
  const handleConfirmArchive = useCallback(() => {
    setShowArchiveConfirm(false);

    if (pendingSubmitData) {
      // Saved from the modal rather than the form, so nothing else awaits this; a failure
      // already shows as the submit error
      executeUpdate(pendingSubmitData).catch(() => undefined);
      setPendingSubmitData(null);
    }
  }, [pendingSubmitData, executeUpdate]);

  const handleCancelArchive = useCallback(() => {
    setShowArchiveConfirm(false);
    setPendingSubmitData(null);
  }, []);

  return (
    <PageContainer>
      <PageHeader title="Edit Video" />

      <ContentPanel>
        {(isLoading || error) && (
          <PageState
            isLoading={isLoading}
            title="Unable to load video"
            message={error?.message}
            actionLabel="Back to Video Library"
            onAction={handleNavigateBack}
          />
        )}

        {video && (
          <>
            <VideoPlayer
              videoId={id}
              ariaLabel={`Preview of ${video.title}`}
              variant="white"
              className="mb-4"
            />
            <VideoReplacer videoId={video.id} publicId={id} className="mb-6" />
          </>
        )}

        {video && formValues && (
          <ComposableForm<VideoEditFormValues> onSubmit={handleFormSubmit} values={formValues}>
            <VideoEditFormFields
              currentStatus={video.status}
              onCancel={handleNavigateBack}
              isSubmitting={updateMutation.isPending}
              errorMessage={submitError}
            />
          </ComposableForm>
        )}
      </ContentPanel>

      <ArchiveVideoModal
        isOpen={showArchiveConfirm}
        onClose={handleCancelArchive}
        onConfirm={handleConfirmArchive}
        isLoading={updateMutation.isPending}
      />
    </PageContainer>
  );
};
