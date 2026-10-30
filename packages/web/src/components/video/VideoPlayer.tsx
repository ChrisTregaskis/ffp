import React, { useCallback, useRef, useState } from 'react';

import { LoadingState } from '@web/components/molecules';
import { useVideoSignedUrlQuery } from '@web/hooks/videos';
import { createLogger } from '@web/lib/logger';

import { VideoOverlay } from './VideoOverlay';
import { VideoPlaceholder } from './VideoPlaceholder';

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
  /** Fill the container (crop to fit) instead of letterboxing  */
  cover?: boolean;
  /** Accessible label for the video element */
  ariaLabel?: string;
  /** Background variant for the player container */
  variant?: 'muted' | 'white';
  /**
   * A preview under someone else's hit area: no controls, no Retry, and every state kept out of
   * the accessibility tree, so the surrounding control is the only target
   */
  decorative?: boolean;
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
  cover = false,
  ariaLabel,
  variant = 'muted',
  decorative = false,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hasPlaybackError, setHasPlaybackError] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasEnded, setHasEnded] = useState(false);

  const isFetchEnabled = !!videoId && !src;
  const {
    data: signedUrlData,
    isPending,
    isError: isFetchError,
    refetch,
  } = useVideoSignedUrlQuery(videoId ?? '', {
    enabled: isFetchEnabled,
  });

  const videoSrc = src ?? signedUrlData?.signedUrl;
  const hasNoSource = !videoId && !src;
  // Pending, not loading: a paused retry would otherwise read as "Video Unavailable"
  const showLoading = isFetchEnabled && isPending;
  const showError = isFetchError || hasPlaybackError;
  const showControls = !decorative;
  const showOverlay =
    showControls && videoSrc && !showLoading && !showError && (!isPlaying || hasEnded);

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
      return <VideoPlaceholder reason="unavailable" />;
    }

    if (showLoading) {
      return <LoadingState layout="fill" message="Loading video..." className="animate-pulse" />;
    }

    if (showError) {
      return decorative ? (
        <VideoPlaceholder reason="error" inert />
      ) : (
        <VideoPlaceholder reason="error" onRetry={handleRetry} />
      );
    }

    if (videoSrc) {
      return (
        <div className="relative h-full w-full">
          <video
            key={videoSrc}
            ref={videoRef}
            src={videoSrc}
            controls={showControls}
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

          {showOverlay && <VideoOverlay hasEnded={hasEnded} onClick={handleOverlayClick} />}
        </div>
      );
    }

    return <VideoPlaceholder reason="unavailable" />;
  };

  return (
    <div
      aria-hidden={decorative || undefined}
      className={`aspect-video overflow-hidden rounded-2xl ${variant === 'white' ? 'bg-white' : 'bg-muted'} ${className ?? ''}`.trim()}
    >
      {renderContent()}
    </div>
  );
};
