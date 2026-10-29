import { useQuery } from '@tanstack/react-query';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { generatePath } from 'react-router-dom';

import type { VideoDetailResponse } from '@ffp/core';

import {
  Button,
  FieldError,
  FloatingPanel,
  Icon,
  Icons,
  LoadingSpinner,
  RequiredIndicator,
  Surface,
  Text,
} from '@web/components/atoms';
import { ErrorRetryState, SearchInput } from '@web/components/molecules';
import { RouteKey, routes } from '@web/config/routes';
import { useClickOutside } from '@web/hooks/useClickOutside';
import { adminVideosApi } from '@web/lib/api/endpoints';
import { videosApi } from '@web/lib/api/endpoints/videos';
import { videoKeys } from '@web/lib/query/keys';
import { minutesToMs } from '@web/utils/time';

const DEBOUNCE_MS = 300;
const SEARCH_PAGE_SIZE = 10;

export interface SelectedVideo {
  publicId: string;
  title: string;
}

export interface VideoSelectorProps {
  /** Called when a video is selected — includes full detail with default prescriptions */
  onSelect: (video: VideoDetailResponse) => void;
  /** Called when the selected video is cleared (Change button) */
  onClear?: () => void;
  /** Currently selected video info (for display) */
  selectedVideo?: SelectedVideo | null;
  /** Whether the selector is disabled */
  disabled?: boolean;
  /** Videos left out of the results, by id: those a session already holds, say */
  excludeVideoIds?: readonly string[];
}

/** Search the active catalogue and pick a video, for an exercise or a question. */
export const VideoSelector: React.FC<VideoSelectorProps> = ({
  onSelect,
  onClear,
  selectedVideo = null,
  disabled = false,
  excludeVideoIds,
}) => {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [pickFailed, setPickFailed] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, DEBOUNCE_MS);

    return () => {
      clearTimeout(timer);
    };
  }, [search]);

  useClickOutside(
    containerRef,
    () => {
      setIsOpen(false);
    },
    isOpen
  );

  // Search query — only runs when dropdown is open and there is a search term
  const {
    data: searchResults,
    isPending: isSearching,
    isError,
    refetch,
  } = useQuery({
    queryKey: videoKeys.adminList({ search: debouncedSearch, status: 'active', page: 1 }),
    queryFn: ({ signal }) =>
      adminVideosApi.list(
        { page: 1, pageSize: SEARCH_PAGE_SIZE, sortBy: 'title', sortDirection: 'asc' },
        { search: debouncedSearch, status: 'active' },
        signal
      ),
    staleTime: minutesToMs(2),
    enabled: isOpen && debouncedSearch.length >= 2,
  });

  const videos = useMemo(() => {
    const excluded = new Set(excludeVideoIds);

    return (searchResults?.data ?? []).filter((video) => !excluded.has(video.id));
  }, [searchResults, excludeVideoIds]);

  const handleSelect = useCallback(
    async (videoPublicId: string) => {
      setIsLoadingDetail(true);
      setPickFailed(false);

      try {
        const detail = await videosApi.get(videoPublicId);
        onSelect(detail);
        setIsOpen(false);
        setSearch('');
        setDebouncedSearch('');
      } catch {
        setPickFailed(true);
      } finally {
        setIsLoadingDetail(false);
      }
    },
    [onSelect]
  );

  const handleSearchChange = useCallback((value: string) => {
    setSearch(value);
    setIsOpen(true);
  }, []);

  const handleChange = useCallback(() => {
    setSearch('');
    setDebouncedSearch('');
    setIsOpen(true);
    onClear?.();
  }, [onClear]);

  // Show selected video
  if (selectedVideo) {
    return (
      <Surface radius="md" padding="row" className="flex items-center gap-3">
        <Icon name={Icons.VIDEO} styleProps={{ size: 'sm', colour: 'var(--color-primary)' }} />
        <Text styleProps={{ size: 'sm', weight: 'medium' }} className="flex-1 truncate">
          {selectedVideo.title}
        </Text>
        <Button
          variant="ghost"
          size="sm"
          icon={<Icon name={Icons.NEWTAB} styleProps={{ size: 'xs', colour: 'currentColor' }} />}
          onClick={() => {
            window.open(
              generatePath(routes[RouteKey.ADMIN_VIDEO_EDIT].path, { id: selectedVideo.publicId }),
              '_blank',
              'noopener,noreferrer'
            );
          }}
          disabled={disabled}
        >
          Preview
        </Button>
        <Button variant="ghost" size="sm" onClick={handleChange} disabled={disabled}>
          Change
        </Button>
      </Surface>
    );
  }

  return (
    <div ref={containerRef} className="relative">
      <Text
        styleProps={{ size: 'sm', weight: 'medium', colour: 'foreground' }}
        className="mb-1 block"
      >
        Video
        <RequiredIndicator />
      </Text>

      <SearchInput
        value={search}
        onChange={handleSearchChange}
        placeholder="Search videos by title..."
        ariaLabel="Search videos"
        className="w-full"
      />

      {/* Dropdown results */}
      {isOpen && debouncedSearch.length >= 2 && (
        <FloatingPanel className="absolute mt-1 w-full">
          {/* Pending, not loading: a search paused offline would otherwise read as no results */}
          {isSearching && (
            <div className="px-3 py-2">
              <LoadingSpinner size="sm" variant="center" />
            </div>
          )}

          {isError && (
            <div className="px-3 py-2">
              <ErrorRetryState
                title="We couldn't search the videos just now."
                onRetry={() => void refetch()}
              />
            </div>
          )}

          {!isSearching && !isError && videos.length === 0 && (
            <div className="px-3 py-2">
              <Text styleProps={{ size: 'sm', colour: 'muted-foreground' }}>No videos found</Text>
            </div>
          )}

          {!isSearching &&
            !isError &&
            videos.map((video) => (
              <Button
                key={video.id}
                variant="ghost"
                className="flex w-full items-center gap-3 rounded-none px-3 py-2 text-left hover:bg-muted"
                onClick={() => {
                  void handleSelect(video.publicId);
                }}
                disabled={isLoadingDetail}
              >
                <div className="min-w-0 flex-1">
                  <Text styleProps={{ size: 'sm', weight: 'medium' }} className="truncate">
                    {video.title}
                  </Text>
                  <div className="flex gap-2">
                    {video.difficulty && (
                      <Text styleProps={{ size: 'xs', colour: 'muted-foreground' }}>
                        {video.difficulty}
                      </Text>
                    )}
                    {video.tags.movement.length > 0 && (
                      <Text styleProps={{ size: 'xs', colour: 'muted-foreground' }}>
                        {video.tags.movement.map((tag) => tag.label).join(', ')}
                      </Text>
                    )}
                  </div>
                </div>
              </Button>
            ))}

          {pickFailed && (
            <div className="border-t border-border px-3 py-2">
              <FieldError message="We couldn't open that video just now. Please pick it again." />
            </div>
          )}

          {isLoadingDetail && (
            <div className="border-t border-border px-3 py-2">
              <LoadingSpinner size="sm" variant="center" />
            </div>
          )}
        </FloatingPanel>
      )}
    </div>
  );
};
