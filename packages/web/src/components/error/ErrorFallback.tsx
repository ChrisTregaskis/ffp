import { useEffect } from 'react';

import { Button } from '@web/components/button/Button';
import { Icon } from '@web/components/Icon/Icon';
import { Icons } from '@web/components/Icon/types';
import { Text } from '@web/components/text/Text';
import { Title } from '@web/components/text/Title';
import { createLogger } from '@web/lib/logger';

const logger = createLogger('ErrorFallback');

/**
 * Props for the ErrorFallback component
 */
export interface ErrorFallbackProps {
  /** The error that was caught */
  error: Error;
  /** Function to reset the error boundary and retry rendering */
  resetErrorBoundary?: () => void;
}

/**
 * Error fallback UI component
 *
 * Displays when an Error Boundary catches an unhandled error.
 * Shows a user-friendly message with options to recover.
 */
export const ErrorFallback: React.FC<ErrorFallbackProps> = ({ error, resetErrorBoundary }) => {
  // Log error details for debugging
  useEffect(() => {
    logger.error('Error boundary caught an error', {
      error: error.message,
      stack: error.stack,
    });
  }, [error]);

  const handleReload = (): void => {
    window.location.reload();
  };

  return (
    <div className="flex min-h-full w-full items-center justify-center bg-muted px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          {/* Error Icon */}
          <div className="mx-auto w-16">
            <Icon
              name={Icons.ALERTTRIANGLE}
              styleProps={{ size: 'xl', colour: 'var(--color-destructive)' }}
              ariaLabel="Error"
            />
          </div>

          {/* Error Title */}
          <div className="mt-6">
            <Title as="h5" colour="destructive">
              Oops! Looks like something went wrong...
            </Title>
          </div>

          {/* Error Message */}
          <div className="mt-2">
            <Text
              as="p"
              styleProps={{ size: 'sm', colour: 'muted-foreground' }}
              className="text-center"
            >
              {`We're sorry, but an unexpected error occurred. Please try reloading the page or returning to the home screen.`}
            </Text>
          </div>

          {/* Error Details (for development) */}
          {import.meta.env.ENVIRONMENT === 'DEVELOPMENT' && (
            <div className="mt-4 rounded-md bg-destructive/10 p-4 text-left">
              <div className="flex">
                <div className="ml-3">
                  <Title as="h3" colour="destructive" className="text-sm">
                    Error Details
                  </Title>
                  <div className="mt-2">
                    <Text
                      as="p"
                      styleProps={{ size: 'xs', colour: 'destructive' }}
                      className="font-mono"
                    >
                      {error.message}
                    </Text>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="mt-8 space-y-3">
          {resetErrorBoundary && (
            <Button onClick={resetErrorBoundary} variant="primary" size="md" fullWidth>
              Try Again
            </Button>
          )}

          <Button onClick={handleReload} variant="secondary" size="md" fullWidth>
            Reload Page
          </Button>
        </div>
      </div>
    </div>
  );
};
