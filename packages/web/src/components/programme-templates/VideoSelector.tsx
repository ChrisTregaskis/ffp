import { useQuery } from '@tanstack/react-query';
import React, { useCallback, useEffect, useRef, useState } from 'react';

import type { VideoDetailResponse } from '@ffp/core';

import { Button } from '@web/components/button';
import { Icon } from '@web/components/Icon';
import { Icons } from '@web/components/Icon/types';
import { LoadingSpinner } from '@web/components/LoadingSpinner';
import { SearchInput } from '@web/components/search/SearchInput';
import { Text } from '@web/components/text';
import { adminVideosApi } from '@web/lib/api/endpoints';
import { videosApi } from '@web/lib/api/endpoints/videos';
import { videoKeys } from '@web/lib/query/keys';
import { minutesToMs } from '@web/utils/time';

const DEBOUNCE_MS = 300;
const SEARCH_PAGE_SIZE = 10;

export interface SelectedVideo {
  id: string;
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
}

/** Search and select a video from the catalogue for exercise creation. */
export const VideoSelector: React.FC<VideoSelectorProps> = ({
  onSelect,
  onClear,
  selectedVideo = null,
  disabled = false,
}) => {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
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

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent): void => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Search query — only runs when dropdown is open and there is a search term
  const { data: searchResults, isLoading: isSearching } = useQuery({
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

  const videos = searchResults?.data ?? [];

  const handleSelect = useCallback(
    async (videoId: string) => {
      setIsLoadingDetail(true);

      try {
        const detail = await videosApi.get(videoId, { includeInactive: true });
        onSelect(detail);
        setIsOpen(false);
        setSearch('');
        setDebouncedSearch('');
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
      <div className="flex items-center gap-3 rounded-md border border-border bg-white px-3 py-2">
        <Icon name={Icons.VIDEO} styleProps={{ size: 'sm', colour: 'var(--color-primary)' }} />
        <Text styleProps={{ size: 'sm', weight: 'medium' }} className="flex-1 truncate">
          {selectedVideo.title}
        </Text>
        <Button
          variant="ghost"
          size="sm"
          icon={<Icon name={Icons.NEWTAB} styleProps={{ size: 'xs', colour: 'currentColor' }} />}
          onClick={() => {
            window.open(`/admin/videos/${selectedVideo.id}`, '_blank', 'noopener,noreferrer');
          }}
          disabled={disabled}
        >
          Preview
        </Button>
        <Button variant="ghost" size="sm" onClick={handleChange} disabled={disabled}>
          Change
        </Button>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative">
      <Text
        styleProps={{ size: 'sm', weight: 'medium', colour: 'foreground' }}
        className="mb-1 block"
      >
        Video <span className="text-destructive">*</span>
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
        <div className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md border border-border bg-white shadow-lg">
          {isSearching && (
            <div className="px-3 py-2">
              <LoadingSpinner size="sm" variant="center" />
            </div>
          )}

          {!isSearching && videos.length === 0 && (
            <div className="px-3 py-2">
              <Text styleProps={{ size: 'sm', colour: 'muted-foreground' }}>No videos found</Text>
            </div>
          )}

          {!isSearching &&
            videos.map((video) => (
              <Button
                key={video.id}
                variant="ghost"
                className="flex w-full items-center gap-3 rounded-none px-3 py-2 text-left hover:bg-muted"
                onClick={() => {
                  void handleSelect(video.id);
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
                    {video.movementType && (
                      <Text styleProps={{ size: 'xs', colour: 'muted-foreground' }}>
                        {video.movementType}
                      </Text>
                    )}
                  </div>
                </div>
              </Button>
            ))}

          {isLoadingDetail && (
            <div className="border-t border-border px-3 py-2">
              <LoadingSpinner size="sm" variant="center" />
            </div>
          )}
        </div>
      )}
    </div>
  );
};
