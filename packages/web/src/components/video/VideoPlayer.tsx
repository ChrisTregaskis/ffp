import { useVideoSignedUrlQuery } from '@web/hooks/videos';

import { VideoUnavailablePlaceholder } from './VideoUnavailablePlaceholder';

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
}) => {
  const { data: signedUrlData } = useVideoSignedUrlQuery(videoId ?? '', {
    enabled: !!videoId && !src,
  });

  const videoSrc = src ?? signedUrlData?.signedUrl;

  return (
    <div className={`aspect-video overflow-hidden rounded-2xl bg-muted ${className ?? ''}`.trim()}>
      {videoSrc ? (
        <video
          src={videoSrc}
          controls
          controlsList="nodownload"
          preload="metadata"
          autoPlay={autoPlay}
          className="h-full w-full object-cover"
          aria-label={ariaLabel}
        >
          <track kind="captions" label="Captions" />
          Your browser does not support the video element.
        </video>
      ) : (
        <VideoUnavailablePlaceholder />
      )}
    </div>
  );
};

