import React, { useCallback, useRef, useState } from 'react';

import { useVideoSignedUrlQuery } from '@web/hooks/videos';
import { createLogger } from '@web/lib/logger';

import { VideoErrorState } from './VideoErrorState';
import { VideoLoadingSkeleton } from './VideoLoadingSkeleton';
import { VideoOverlay } from './VideoOverlay';
import { VideoUnavailablePlaceholder } from './VideoUnavailablePlaceholder';

const logger = createLogger('VideoPlayer');

export interface VideoPlayerProps {
  /** Video ID — fetches a signed CloudFront URL via the signed URL hook */
  videoId?: string;
  /** Direct video source URL — skips the signed URL fetch */
  src?: string;
  /** Additional CSS classes for the outer container */
  className?: string;
  /** Auto-play when the video source is ready */
  autoPlay?: boolean;
  /** Loop playback */
  loop?: boolean;
  /** Mute audio (required for autoplay in most browsers) */
  muted?: boolean;
  /** Hide native controls and play/replay overlay */
  hideControls?: boolean;
  /** Fill the container (crop to fit) instead of letterboxing  */
  cover?: boolean;
  /** Accessible label for the video element */
  ariaLabel?: string;
  /** Background variant for the player container */
  variant?: 'muted' | 'white';
}

/**
 * Video player component using the native HTML5 video element.
 *
 * Supports two modes:
 * - **videoId**: Fetches a time-limited signed CloudFront URL automatically
 * - **src**: Uses a provided URL directly (e.g., when the parent already has one)
 *
 * Includes play/replay overlay: shows play icon before first play,
 * replay icon after video ends.
 */
export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  videoId,
  src,
  className,
  autoPlay = false,
  loop = false,
  muted = false,
  hideControls = false,
  cover = false,
  ariaLabel,
  variant = 'muted',
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hasPlaybackError, setHasPlaybackError] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasEnded, setHasEnded] = useState(false);

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
  const showOverlay = videoSrc && !showLoading && !showError && (!isPlaying || hasEnded);

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

  const handlePlay = useCallback((): void => {
    setIsPlaying(true);
    setHasEnded(false);
  }, []);

  const handlePause = useCallback((): void => {
    setIsPlaying(false);
  }, []);

  const handleEnded = useCallback((): void => {
    setIsPlaying(false);
    setHasEnded(true);
  }, []);

  const handleOverlayClick = useCallback((): void => {
    if (!videoRef.current) {
      return;
    }

    if (hasEnded) {
      videoRef.current.currentTime = 0;
    }

    void videoRef.current.play();
  }, [hasEnded]);

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
        <div className="relative h-full w-full">
          <video
            key={videoSrc}
            ref={videoRef}
            src={videoSrc}
            controls={!hideControls}
            controlsList="nodownload"
            preload="metadata"
            autoPlay={autoPlay}
            loop={loop}
            muted={muted}
            playsInline
            className={`h-full w-full bg-black ${cover ? 'object-cover' : 'object-contain'}`}
            aria-label={ariaLabel}
            onError={handleVideoError}
            onPlay={handlePlay}
            onPause={handlePause}
            onEnded={handleEnded}
          >
            <track kind="captions" label="Captions" />
            Your browser does not support the video element.
          </video>

          {!hideControls && showOverlay && (
            <VideoOverlay hasEnded={hasEnded} onClick={handleOverlayClick} />
          )}
        </div>
      );
    }

    return <VideoUnavailablePlaceholder />;
  };

  return (
    <div
      className={`aspect-video overflow-hidden rounded-2xl ${variant === 'white' ? 'bg-white' : 'bg-muted'} ${className ?? ''}`.trim()}
    >
      {renderContent()}
    </div>
  );
};
