import { LoadingSpinner } from '@web/components/LoadingSpinner';
import { Text } from '@web/components/text';

/** Skeleton shown while the signed video URL is being fetched. */
export const VideoLoadingSkeleton: React.FC = () => (
  <div className="flex h-full w-full animate-pulse flex-col items-center justify-center gap-3">
    <LoadingSpinner size="lg" variant="inline" />
    <Text as="p" styleProps={{ size: 'sm', colour: 'muted-foreground' }}>
      Loading video...
    </Text>
  </div>
);
