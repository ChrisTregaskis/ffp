import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

import { adminVideoFilterSchema } from '@ffp/core';

import { Button } from '@web/components/button';
import { Icon } from '@web/components/Icon';
import { PageContainer, PageHeader } from '@web/components/layout';
import { Table, TableControls } from '@web/components/table';
import { useApiTable } from '@web/hooks/useApiTable';
import { useAdminVideosQuery } from '@web/hooks/videos';
import { RouteKey, routes } from '@web/pages/routes';

import { videoColumns, type VideoRow } from './video-library/columns';
import { TABLE_FILTERS } from './video-library/constants';
import { VideoLibraryEmptyState } from './video-library/VideoLibraryEmptyState';

export const VideoLibraryPage: React.FC = () => {
  const navigate = useNavigate();

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
    </PageContainer>
  );
};
