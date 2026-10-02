import React, { useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { adminVideoFilterSchema } from '@ffp/core';
import type { AdminVideoListResponse, PaginationInput } from '@ffp/core';

import { AdminListPageShell } from '@web/components/layout';
import type { ListEmptyStateControls, ListFilterValues } from '@web/components/layout';
import { ArchiveVideoModal } from '@web/components/modal';
import type { RowAction } from '@web/components/table';
import { useToast } from '@web/hooks/useToast';
import { useAdminVideosQuery, useUpdateVideoMutation } from '@web/hooks/videos';
import { RouteKey, routes } from '@web/pages/routes';

import { buildVideoColumns, type VideoRow } from './video-library/columns';
import { TABLE_FILTERS } from './video-library/constants';
import { VideoLibraryEmptyState } from './video-library/VideoLibraryEmptyState';

const DEFAULT_SORT = { id: 'createdAt', desc: true };
const DEFAULT_COLUMN_VISIBILITY = { movementType: false, updatedAt: false, tags: false };

/** The video list takes enum-typed filters, so the raw values pass through its schema first. */
const useVideoList = (
  pagination: PaginationInput,
  filters: ListFilterValues
): ReturnType<typeof useAdminVideosQuery> => {
  const parsed = adminVideoFilterSchema.safeParse(filters);

  return useAdminVideosQuery(pagination, parsed.success ? parsed.data : {});
};

const toVideoRow = (video: AdminVideoListResponse): VideoRow => video as VideoRow;

export const VideoLibraryPage: React.FC = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const updateMutation = useUpdateVideoMutation();
  const [archiveTarget, setArchiveTarget] = useState<VideoRow | null>(null);

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
        { id: row.id, publicId: row.publicId, data: { status: 'active' } },
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
        { id: row.id, publicId: row.publicId, data: { status: 'active' } },
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
      { id: archiveTarget.id, publicId: archiveTarget.publicId, data: { status: 'archived' } },
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

  const renderEmptyState = useCallback(
    ({ hasActiveControls }: ListEmptyStateControls) => (
      <VideoLibraryEmptyState hasFilters={hasActiveControls} onUploadClick={handleUploadClick} />
    ),
    [handleUploadClick]
  );

  return (
    <AdminListPageShell
      title="Video Library"
      subtitle="Manage exercise videos — upload, edit metadata, and control availability"
      createLabel="Upload Video"
      createIcon="Upload"
      onCreate={handleUploadClick}
      tableId="admin-videos"
      defaultSort={DEFAULT_SORT}
      defaultColumnVisibility={DEFAULT_COLUMN_VISIBILITY}
      filters={TABLE_FILTERS}
      searchPlaceholder="Search by title..."
      useList={useVideoList}
      toRow={toVideoRow}
      columns={videoColumns}
      renderEmptyState={renderEmptyState}
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
