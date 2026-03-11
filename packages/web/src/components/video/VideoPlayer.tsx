import React, { useCallback, useState } from 'react';

import { useVideoSignedUrlQuery } from '@web/hooks/videos';
import { createLogger } from '@web/lib/logger';

import { VideoErrorState } from './VideoErrorState';
import { VideoLoadingSkeleton } from './VideoLoadingSkeleton';
import { VideoUnavailablePlaceholder } from './VideoUnavailablePlaceholder';

const logger = createLogger('VideoPlayer');

export interface VideoPlayerProps {
  /** Video ID — fetches a signed CloudFront URL via the signed URL hook */
  videoId?: string;
  /** Direct video source URL — skips the signed URL fetch */
  src?: string;
  /** Additional CSS classes for the outer container */
  className?: string;
  /** Auto-play when the video source is ready @default false */
  autoPlay?: boolean;
  /** Accessible label for the video element */
  ariaLabel?: string;
  /** Background variant for the player container @default 'muted' */
  variant?: 'muted' | 'white';
}

/**
 * Video player component using the native HTML5 video element.
 *
 * Supports two modes:
 * - **videoId**: Fetches a time-limited signed CloudFront URL automatically
 * - **src**: Uses a provided URL directly (e.g., when the parent already has one)
 */
export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  videoId,
  src,
  className,
  autoPlay = false,
  ariaLabel,
  variant = 'muted',
}) => {
  const [hasPlaybackError, setHasPlaybackError] = useState(false);

  const isFetchEnabled = !!videoId && !src;
  const {
    data: signedUrlData,
    isLoading,
    isError: isFetchError,
    refetch,
  } = useVideoSignedUrlQuery(videoId ?? '', {
    enabled: isFetchEnabled,
  });

  const videoSrc = src ?? signedUrlData?.signedUrl;
  const hasNoSource = !videoId && !src;
  const showLoading = isFetchEnabled && isLoading;
  const showError = isFetchError || hasPlaybackError;

  const handleRetry = useCallback(() => {
    setHasPlaybackError(false);
    void refetch();
  }, [refetch]);

  const handleVideoError = useCallback(
    (e: React.SyntheticEvent<HTMLVideoElement>) => {
      const mediaError = e.currentTarget.error;
      logger.error('Video playback error', {
        videoId,
        code: mediaError?.code,
        message: mediaError?.message,
      });
      setHasPlaybackError(true);
    },
    [videoId]
  );

  const renderContent = (): React.ReactNode => {
    if (hasNoSource) {
      return <VideoUnavailablePlaceholder />;
    }

    if (showLoading) {
      return <VideoLoadingSkeleton />;
    }

    if (showError) {
      return <VideoErrorState onRetry={handleRetry} />;
    }

    if (videoSrc) {
      return (
        <video
          src={videoSrc}
          controls
          controlsList="nodownload"
          preload="metadata"
          autoPlay={autoPlay}
          className="h-full w-full bg-black object-contain"
          aria-label={ariaLabel}
          onError={handleVideoError}
        >
          <track kind="captions" label="Captions" />
          Your browser does not support the video element.
        </video>
      );
    }

    return <VideoUnavailablePlaceholder />;
  };

  return (
    <div className={`aspect-video overflow-hidden rounded-2xl ${variant === 'white' ? 'bg-white' : 'bg-muted'} ${className ?? ''}`.trim()}>
      {renderContent()}
    </div>
  );
};
