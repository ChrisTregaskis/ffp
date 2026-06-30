import { useCallback, useMemo, useState } from 'react';

import { Button } from '@web/components/button';
import { Icon, Icons } from '@web/components/Icon';
import { Table, TableControls } from '@web/components/table';
import type { RowAction, TableFilterConfig } from '@web/components/table';
import { Text } from '@web/components/text';
import { useApiTable } from '@web/hooks/useApiTable';

import { type PrototypeVideo, type VideoStatus, VIDEO_LIBRARY } from './prototype-videos';
import { VideoEditPanel } from './VideoEditPanel';
import { buildVideoColumns, type VideoRow } from './videoLibraryColumns';
import { VideoLibraryIterationNote } from './VideoLibraryIterationNote';
import { ViewHeader } from './ViewHeader';

const TABLE_FILTERS: TableFilterConfig[] = [
  {
    key: 'status',
    label: 'Status',
    options: [
      { label: 'Draft', value: 'draft' },
      { label: 'Active', value: 'active' },
      { label: 'Archived', value: 'archived' },
    ],
  },
  {
    key: 'difficulty',
    label: 'Difficulty',
    options: [
      { label: 'Beginner', value: 'beginner' },
      { label: 'Intermediate', value: 'intermediate' },
      { label: 'Advanced', value: 'advanced' },
    ],
  },
];

/** Faithful recreation of the live Video Library table, iterated for the programme model. */
export const VideoLibraryView: React.FC = () => {
  const [videos, setVideos] = useState<PrototypeVideo[]>(VIDEO_LIBRARY);
  const [editId, setEditId] = useState<string | null>(null);

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
  } = useApiTable({ defaultPageSize: 10, defaultSort: { id: 'createdAt', desc: true } });

  // Client-side filtering — stands in for the server query the real page runs.
  const filtered = useMemo(() => {
    const term = debouncedSearch.trim().toLowerCase();
    const statusFilter = debouncedFilters.status;
    const difficultyFilter = debouncedFilters.difficulty;

    return videos.filter((video) => {
      const matchesSearch = term === '' || video.title.toLowerCase().includes(term);
      const matchesStatus = !statusFilter || video.status === statusFilter;
      const matchesDifficulty = !difficultyFilter || video.difficulty === difficultyFilter;

      return matchesSearch && matchesStatus && matchesDifficulty;
    });
  }, [videos, debouncedSearch, debouncedFilters]);

  const sorted = useMemo(() => {
    const { sortBy, sortDirection } = queryParams;

    if (!sortBy) {
      return filtered;
    }

    const direction = sortDirection === 'desc' ? -1 : 1;

    return [...filtered].sort((a, b) => {
      const aValue = a[sortBy as keyof PrototypeVideo];
      const bValue = b[sortBy as keyof PrototypeVideo];

      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return (aValue - bValue) * direction;
      }

      return String(aValue).localeCompare(String(bValue)) * direction;
    });
  }, [filtered, queryParams]);

  const pageRows = useMemo(() => {
    const start = (queryParams.page - 1) * queryParams.pageSize;

    return sorted.slice(start, start + queryParams.pageSize) as VideoRow[];
  }, [sorted, queryParams.page, queryParams.pageSize]);

  const setStatus = useCallback((id: string, status: VideoStatus): void => {
    setVideos((prev) => prev.map((video) => (video.id === id ? { ...video, status } : video)));
  }, []);

  const rowActions = useCallback(
    (): RowAction<VideoRow>[] => [
      {
        label: 'Edit',
        onClick: (row) => {
          setEditId(row.id);
        },
      },
      {
        label: 'Publish',
        onClick: (row) => {
          setStatus(row.id, 'active');
        },
        hidden: (row) => row.status !== 'draft',
      },
      {
        label: 'Restore',
        onClick: (row) => {
          setStatus(row.id, 'active');
        },
        hidden: (row) => row.status !== 'archived',
      },
      {
        label: 'Archive',
        onClick: (row) => {
          setStatus(row.id, 'archived');
        },
        variant: 'danger',
        hidden: (row) => row.status !== 'active',
      },
    ],
    [setStatus]
  );

  const videoColumns = useMemo(() => buildVideoColumns(rowActions), [rowActions]);

  const editVideo = videos.find((video) => video.id === editId) ?? null;

  const updateVideo = useCallback((next: PrototypeVideo): void => {
    setVideos((prev) => prev.map((video) => (video.id === next.id ? next : video)));
  }, []);

  return (
    <div>
      <ViewHeader
        title="Video Library"
        subtitle="Manage exercise videos — the catalogue programmes and templates draw exercises from."
        actions={
          <Button
            variant="primary"
            size="md"
            icon={<Icon name={Icons.UPLOAD} styleProps={{ size: 'sm', colour: 'currentColor' }} />}
          >
            Upload Video
          </Button>
        }
      />

      <VideoLibraryIterationNote />

      <Table<VideoRow>
        tableId="prototype-videos"
        data={pageRows}
        columns={videoColumns}
        totalRows={sorted.length}
        isLoading={false}
        onStateChange={onStateChange}
        defaultSort={{ id: 'createdAt', desc: true }}
        defaultColumnVisibility={{ tags: false }}
        getRowId={(row) => row.id}
        emptyState={
          <div className="px-6 py-10 text-center">
            <Text styleProps={{ colour: 'muted-foreground' }}>
              {hasActiveControls ? 'No videos match your search and filters.' : 'No videos yet.'}
            </Text>
          </div>
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

      <VideoEditPanel
        video={editVideo}
        onChange={updateVideo}
        onClose={() => {
          setEditId(null);
        }}
      />
    </div>
  );
};
