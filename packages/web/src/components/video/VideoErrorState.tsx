import { Button } from '@web/components/button';
import { IconBadge, Icons } from '@web/components/Icon';
import { Text } from '@web/components/text';

export interface VideoErrorStateProps {
  /** Callback to retry fetching the video URL */
  onRetry: () => void;
}

/** Error state shown when the video URL fails to load or the video cannot play. */
export const VideoErrorState: React.FC<VideoErrorStateProps> = ({ onRetry }) => (
  <div className="flex h-full w-full flex-col items-center justify-center gap-3">
    <IconBadge name={Icons.ALERTTRIANGLE} size="lg" variant="warning" />
    <Text as="p" styleProps={{ size: 'lg', weight: 'semibold', colour: 'foreground' }}>
      Unable to Load Video
    </Text>
    <Text
      as="p"
      styleProps={{ size: 'sm', colour: 'muted-foreground' }}
      className="max-w-xs text-center"
    >
      The video could not be loaded. This may be due to an expired link or a temporary issue.
    </Text>
    <Button variant="secondary" size="sm" onClick={onRetry} className="mt-1">
      Retry
    </Button>
  </div>
);
