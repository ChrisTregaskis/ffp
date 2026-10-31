import React, { useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import type { AdminVideoListResponse, PaginationInput } from '@ffp/core';

import type { RowAction } from '@web/components/organisms';
import { AdminListPageShell } from '@web/components/templates';
import type { AdminListEmptyState, ListFilterValues } from '@web/components/templates';
import { ArchiveVideoModal } from '@web/components/video';
import { RouteKey, routes } from '@web/config/routes';
import { useTagCategoriesQuery } from '@web/hooks/tags';
import { useToast } from '@web/hooks/useToast';
import { useAdminVideosQuery, useUpdateVideoMutation } from '@web/hooks/videos';

import { buildVideoColumns, type VideoRow } from './columns';
import { TABLE_FILTERS } from './constants';
import { toTagFilters, toVideoListFilters } from './video-list-filters';

const DEFAULT_SORT = { id: 'createdAt', desc: true };

const DEFAULT_COLUMN_VISIBILITY = { movement: false, audience: false, updatedAt: false };

const useVideoList = (
  pagination: PaginationInput,
  filters: ListFilterValues
): ReturnType<typeof useAdminVideosQuery> =>
  useAdminVideosQuery(pagination, toVideoListFilters(filters));

const toLabels = (tags: { label: string }[]): string[] => tags.map((tag) => tag.label);

const toVideoRow = (video: AdminVideoListResponse): VideoRow => ({
  ...video,
  goal: toLabels(video.tags.goal),
  movement: toLabels(video.tags.movement),
  bodyAreas: toLabels(video.tags['body-area']),
  audience: toLabels(video.tags.audience),
});

const EMPTY_STATE: AdminListEmptyState = {
  filteredTitle: 'No matching exercises',
  icon: 'Video',
  iconVariant: 'primary',
  title: 'No exercises yet',
  description: 'Upload your first exercise video to start building the exercise library.',
};

export const VideoLibraryPage: React.FC = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const updateMutation = useUpdateVideoMutation();
  const [archiveTarget, setArchiveTarget] = useState<VideoRow | null>(null);
  const { data: tagCategories } = useTagCategoriesQuery();
  const filters = useMemo(
    () => [...TABLE_FILTERS, ...toTagFilters(tagCategories)],
    [tagCategories]
  );

  const handleUploadClick = useCallback((): void => {
    void navigate(routes[RouteKey.ADMIN_VIDEO_UPLOAD].path);
  }, [navigate]);

  const handleEditClick = useCallback(
    (row: VideoRow): void => {
      void navigate(`${routes[RouteKey.ADMIN_VIDEOS].path}/${row.publicId}`);
    },
    [navigate]
  );

  /** Quick-action: publish a draft video (draft → active) */
  const handlePublish = useCallback(
    (row: VideoRow): void => {
      updateMutation.mutate(
        { publicId: row.publicId, data: { status: 'active' } },
        {
          onSuccess: () => {
            addToast(`"${row.title}" published successfully`, { variant: 'success' });
          },
          onError: (err) => {
            addToast(err.message, { variant: 'error' });
          },
        }
      );
    },
    [updateMutation, addToast]
  );

  /** Quick-action: restore an archived video (archived → active) */
  const handleRestore = useCallback(
    (row: VideoRow): void => {
      updateMutation.mutate(
        { publicId: row.publicId, data: { status: 'active' } },
        {
          onSuccess: () => {
            addToast(`"${row.title}" restored to active`, { variant: 'success' });
          },
          onError: (err) => {
            addToast(err.message, { variant: 'error' });
          },
        }
      );
    },
    [updateMutation, addToast]
  );

  /** Confirm archiving after dialog */
  const handleConfirmArchive = useCallback(() => {
    if (!archiveTarget) {
      return;
    }

    updateMutation.mutate(
      { publicId: archiveTarget.publicId, data: { status: 'archived' } },
      {
        onSuccess: () => {
          addToast(`"${archiveTarget.title}" archived`, { variant: 'success' });
          setArchiveTarget(null);
        },
        onError: (err) => {
          addToast(err.message, { variant: 'error' });
          setArchiveTarget(null);
        },
      }
    );
  }, [archiveTarget, updateMutation, addToast]);

  /** Build row actions based on current video status */
  const rowActions = useCallback(
    (_row: VideoRow): RowAction<VideoRow>[] => [
      {
        label: 'Edit',
        onClick: handleEditClick,
      },
      {
        label: 'Publish',
        onClick: handlePublish,
        hidden: (r) => r.status !== 'draft',
      },
      {
        label: 'Restore',
        onClick: handleRestore,
        hidden: (r) => r.status !== 'archived',
      },
      {
        label: 'Archive',
        onClick: (r) => {
          setArchiveTarget(r);
        },
        variant: 'danger',
        hidden: (r) => r.status !== 'active',
      },
    ],
    [handleEditClick, handlePublish, handleRestore]
  );

  const videoColumns = useMemo(() => buildVideoColumns(rowActions), [rowActions]);

  return (
    <AdminListPageShell
      title="Exercises"
      subtitle="Curate the exercise videos programmes draw on: upload, tag and control availability"
      createLabel="Upload Video"
      createIcon="Upload"
      onCreate={handleUploadClick}
      tableId="admin-videos"
      defaultSort={DEFAULT_SORT}
      defaultColumnVisibility={DEFAULT_COLUMN_VISIBILITY}
      filters={filters}
      searchPlaceholder="Search by title..."
      useList={useVideoList}
      toRow={toVideoRow}
      columns={videoColumns}
      emptyState={EMPTY_STATE}
    >
      <ArchiveVideoModal
        isOpen={!!archiveTarget}
        onClose={() => {
          setArchiveTarget(null);
        }}
        onConfirm={handleConfirmArchive}
        isLoading={updateMutation.isPending}
      />
    </AdminListPageShell>
  );
};
