import { LoadingSpinner, Text } from '@web/components/atoms';

export interface PageLoadingStateProps {
  /** Loading message displayed beneath the spinner */
  message?: string;
}

/**
 * Full-page centred loading state with spinner and optional message.
 *
 * Used as the initial loading state for page-level data fetches.
 */
export const PageLoadingState: React.FC<PageLoadingStateProps> = ({ message = 'Loading...' }) => (
  <div className="flex min-h-[60vh] items-center justify-center">
    <div className="flex flex-col items-center gap-4">
      <LoadingSpinner size="lg" />
      <Text as="p" styleProps={{ size: 'base', colour: 'muted-foreground' }}>
        {message}
      </Text>
    </div>
  </div>
);
