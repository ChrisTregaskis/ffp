import React, { useCallback, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import type { UpdateVideoInput, VideoStatus } from '@ffp/core';

import { PageState } from '@web/components/feedback/PageState';
import { ComposableForm } from '@web/components/form/composableForm';
import { ContentPanel, PageContainer, PageHeader } from '@web/components/layout';
import { ArchiveVideoModal } from '@web/components/modal';
import { VideoPlayer } from '@web/components/video/VideoPlayer';
import { useToast } from '@web/hooks/useToast';
import { useUpdateVideoMutation, useVideoQuery } from '@web/hooks/videos';
import { RouteKey, routes } from '@web/pages/routes';

import { VideoEditFormFields } from './VideoEditFormFields';

import type { VideoEditFormValues } from './types';

export const VideoEditPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addToast } = useToast();

  const { data: video, isLoading, error } = useVideoQuery(id ?? '', { includeInactive: true });
  const updateMutation = useUpdateVideoMutation();

  const [showArchiveConfirm, setShowArchiveConfirm] = useState(false);
  const [pendingSubmitData, setPendingSubmitData] = useState<UpdateVideoInput | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  /** Build default form values from video data */
  const defaultValues = useMemo((): VideoEditFormValues | undefined => {
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
      defaultSets: video.defaultSets != null ? String(video.defaultSets) : '',
      defaultReps: video.defaultReps ?? '',
      defaultDurationSeconds:
        video.defaultDurationSeconds != null ? String(video.defaultDurationSeconds) : '',
      defaultRestSeconds: video.defaultRestSeconds != null ? String(video.defaultRestSeconds) : '',
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

      // Prescription fields — convert empty strings to null, string numbers to integers
      const toIntOrNull = (val: string): number | null => (val ? parseInt(val, 10) : null);
      const toStringOrNull = (val: string): string | null => val || null;

      const newSets = toIntOrNull(values.defaultSets);

      if (newSets !== (video.defaultSets ?? null)) {
        payload.defaultSets = newSets;
      }

      const newReps = toStringOrNull(values.defaultReps);

      if (newReps !== (video.defaultReps ?? null)) {
        payload.defaultReps = newReps;
      }

      const newDuration = toIntOrNull(values.defaultDurationSeconds);

      if (newDuration !== (video.defaultDurationSeconds ?? null)) {
        payload.defaultDurationSeconds = newDuration;
      }

      const newRest = toIntOrNull(values.defaultRestSeconds);

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
    (data: UpdateVideoInput) => {
      if (!id) {
        return;
      }

      setSubmitError(null);

      updateMutation.mutate(
        { id, data },
        {
          onSuccess: () => {
            addToast('Video updated successfully', { variant: 'success' });
            handleNavigateBack();
          },
          onError: (err) => {
            setSubmitError(err.message);
          },
        }
      );
    },
    [id, updateMutation, addToast, handleNavigateBack]
  );

  /** Handle form submission — intercept archive transitions for confirmation */
  const handleFormSubmit = useCallback(
    (values: VideoEditFormValues) => {
      const payload = buildUpdatePayload(values);

      // If no changes, just navigate back
      if (Object.keys(payload).length === 0) {
        handleNavigateBack();

        return;
      }

      // If archiving, show confirmation dialog
      if (payload.status === 'archived') {
        setPendingSubmitData(payload);
        setShowArchiveConfirm(true);

        return;
      }

      executeUpdate(payload);
    },
    [buildUpdatePayload, executeUpdate, handleNavigateBack]
  );

  /** Confirm archiving after dialog */
  const handleConfirmArchive = useCallback(() => {
    setShowArchiveConfirm(false);

    if (pendingSubmitData) {
      executeUpdate(pendingSubmitData);
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
          <VideoPlayer
            videoId={id}
            ariaLabel={`Preview of ${video.title}`}
            variant="white"
            className="mb-6"
          />
        )}

        {video && defaultValues && (
          <ComposableForm<VideoEditFormValues>
            onSubmit={handleFormSubmit}
            defaultValues={defaultValues}
          >
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
