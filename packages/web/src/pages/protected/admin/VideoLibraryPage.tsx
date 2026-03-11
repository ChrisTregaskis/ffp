import React, { useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { adminVideoFilterSchema } from '@ffp/core';

import { Button } from '@web/components/button';
import { Icon } from '@web/components/Icon';
import { PageContainer, PageHeader } from '@web/components/layout';
import { ArchiveVideoModal } from '@web/components/modal';
import { Table, TableControls } from '@web/components/table';
import type { RowAction } from '@web/components/table';
import { useApiTable } from '@web/hooks/useApiTable';
import { useToast } from '@web/hooks/useToast';
import { useAdminVideosQuery, useUpdateVideoMutation } from '@web/hooks/videos';
import { RouteKey, routes } from '@web/pages/routes';

import { buildVideoColumns, type VideoRow } from './video-library/columns';
import { TABLE_FILTERS } from './video-library/constants';
import { VideoLibraryEmptyState } from './video-library/VideoLibraryEmptyState';

export const VideoLibraryPage: React.FC = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const updateMutation = useUpdateVideoMutation();

  const [archiveTarget, setArchiveTarget] = useState<VideoRow | null>(null);

  const {
    onStateChange,
    queryParams,
    search,
    onSearchChange,
    filterValues,
    onFilterChange,
    debouncedSearch,
    debouncedFilters,
    clearAll,
    hasActiveControls,
  } = useApiTable({
    defaultPageSize: 10,
    defaultSort: { id: 'createdAt', desc: true },
  });

  // Build filter params from debounced values — Zod validates and infers correct types
  const adminFilters = useMemo(() => {
    const result = adminVideoFilterSchema.safeParse({
      search: debouncedSearch || undefined,
      status: debouncedFilters.status || undefined,
      difficulty: debouncedFilters.difficulty || undefined,
    });

    return result.success ? result.data : {};
  }, [debouncedSearch, debouncedFilters]);

  const { data, isLoading, error } = useAdminVideosQuery(queryParams, adminFilters);

  const handleUploadClick = (): void => {
    void navigate(routes[RouteKey.ADMIN_VIDEO_UPLOAD].path);
  };

  const handleEditClick = useCallback(
    (row: VideoRow): void => {
      void navigate(`${routes[RouteKey.ADMIN_VIDEOS].path}/${row.id}`);
    },
    [navigate]
  );

  /** Quick-action: publish a draft video (draft → active) */
  const handlePublish = useCallback(
    (row: VideoRow): void => {
      updateMutation.mutate(
        { id: row.id, data: { status: 'active' } },
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
        { id: row.id, data: { status: 'active' } },
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
      { id: archiveTarget.id, data: { status: 'archived' } },
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
    <PageContainer>
      <PageHeader
        title="Video Library"
        subtitle="Manage exercise videos — upload, edit metadata, and control availability"
        actions={
          <Button
            variant="primary"
            icon={<Icon name="Upload" styleProps={{ size: 'sm', colour: 'currentColor' }} />}
            onClick={handleUploadClick}
          >
            Upload Video
          </Button>
        }
      />

      <Table<VideoRow>
        tableId="admin-videos"
        data={data ? (data.data as VideoRow[]) : []}
        columns={videoColumns}
        totalRows={data?.pagination.total ?? 0}
        isLoading={isLoading}
        error={error?.message}
        onStateChange={onStateChange}
        defaultSort={{ id: 'createdAt', desc: true }}
        defaultColumnVisibility={{ movementType: false, updatedAt: false, tags: false }}
        getRowId={(row) => row.id}
        emptyState={
          <VideoLibraryEmptyState
            hasFilters={hasActiveControls}
            onUploadClick={handleUploadClick}
          />
        }
        renderControls={(cols) => (
          <TableControls
            search={search}
            onSearchChange={onSearchChange}
            searchPlaceholder="Search by title..."
            filters={TABLE_FILTERS}
            filterValues={filterValues}
            onFilterChange={onFilterChange}
            columns={cols}
            onClearAll={clearAll}
            hasActiveControls={hasActiveControls}
          />
        )}
      />

      <ArchiveVideoModal
        isOpen={!!archiveTarget}
        onClose={() => {
          setArchiveTarget(null);
        }}
        onConfirm={handleConfirmArchive}
        isLoading={updateMutation.isPending}
      />
    </PageContainer>
  );
};
