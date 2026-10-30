import React from 'react';

import { Button, IconBadge, Icons, Text } from '@web/components/atoms';

export type VideoPlaceholderProps =
  | {
      /** No video is attached to the exercise */
      reason: 'unavailable';
    }
  | {
      /** The video URL failed to load or the video cannot play */
      reason: 'error';
      /** Fetches the video URL again */
      onRetry: () => void;
    }
  | {
      reason: 'error';
      /** No Retry, for a decorative frame under someone else's hit area */
      inert: true;
    };

/** What the video frame shows in place of a playable video. */
export const VideoPlaceholder: React.FC<VideoPlaceholderProps> = (props) => {
  const isError = props.reason === 'error';

  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-3">
      {isError ? (
        <IconBadge name={Icons.ALERTTRIANGLE} size="lg" variant="warning" appearance="solid" />
      ) : (
        <IconBadge name={Icons.PLAY} size="lg" variant="secondary" />
      )}
      <Text as="p" styleProps={{ size: 'lg', weight: 'semibold', colour: 'foreground' }}>
        {isError ? 'Unable to Load Video' : 'Video Unavailable'}
      </Text>
      <Text
        as="p"
        styleProps={{ size: 'sm', colour: 'muted-foreground' }}
        className="max-w-xs text-center"
      >
        {isError
          ? 'The video could not be loaded. This may be due to an expired link or a temporary issue.'
          : 'This exercise does not have a video attached yet.'}
      </Text>
      {props.reason === 'error' && 'onRetry' in props && (
        <Button variant="secondary" size="sm" onClick={props.onRetry} className="mt-1">
          Retry
        </Button>
      )}
    </div>
  );
};
