import { Button, Icons } from '@web/components/atoms';
import { StatusResult } from '@web/components/molecules';
import { useGoHome } from '@web/hooks/useGoHome';

/**
 * Page not found (404) component
 *
 * Displayed when a user navigates to a URL that does not match any route.
 * Shows a user-friendly message and provides a button to navigate to
 * their role-appropriate home page.
 */
export const NotFoundPage: React.FC = () => {
  const handleGoHome = useGoHome();

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-muted px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        <StatusResult
          icon={Icons.SEARCH}
          title="Page not found"
          description="The page you are looking for does not exist or has been moved."
          actions={
            <Button onClick={handleGoHome} variant="primary" size="md">
              Go Home
            </Button>
          }
        />
      </div>
    </div>
  );
};
