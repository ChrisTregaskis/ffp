import { useState } from 'react';

import { Button } from '@web/components/button';
import { Card } from '@web/components/Card';
import { DemoTabs, type DemoTab } from '@web/components/demo';
import {
  ComponentPageHeader,
  ComponentPageWrapper,
  ComponentSection,
  DeveloperInstructions,
} from '@web/components/dev';
import { ErrorBoundary } from '@web/components/error';
import { Text } from '@web/components/text';

/**
 * Component that throws an error when button is clicked
 */
const BuggyComponent: React.FC<{ shouldThrow: boolean }> = ({ shouldThrow }) => {
  if (shouldThrow) {
    throw new Error('💥 This is a demo error from BuggyComponent!');
  }

  return (
    <Card>
      <div className="space-y-2">
        <Text styleProps={{ weight: 'semibold' }}>Buggy Component</Text>
        <Text styleProps={{ colour: 'muted-foreground', size: 'sm' }}>
          This component is working normally. Click the button below to trigger an error.
        </Text>
      </div>
    </Card>
  );
};

/**
 * Custom fallback component demo
 */
const CustomErrorFallback: React.FC<{ error: Error; resetErrorBoundary?: () => void }> = ({
  error,
  resetErrorBoundary,
}) => {
  return (
    <Card>
      <div className="space-y-4">
        <div>
          <Text styleProps={{ weight: 'semibold', colour: 'destructive' }}>
            Custom Error Fallback
          </Text>
          <Text styleProps={{ size: 'sm', colour: 'muted-foreground' }}>{error.message}</Text>
        </div>
        {resetErrorBoundary && (
          <Button variant="secondary" size="sm" onClick={resetErrorBoundary}>
            Try Again
          </Button>
        )}
      </div>
    </Card>
  );
};

/**
 * Error Boundary showcase page (development only).
 *
 * Demonstrates error boundary features:
 * - Basic error catching and fallback UI
 * - Reset functionality
 * - Custom fallback components
 * - Nested error boundaries
 * - Best practices and usage patterns
 */
export const ErrorBoundaryShowcasePage = (): JSX.Element => {
  const componentTabs: DemoTab[] = [
    { id: 'basic', label: 'Basic', content: <BasicDemo /> },
    { id: 'custom-fallback', label: 'Custom Fallback', content: <CustomFallbackDemo /> },
    { id: 'nested', label: 'Nested Boundaries', content: <NestedBoundariesDemo /> },
  ];

  return (
    <ComponentPageWrapper maxWidth="6xl">
      <ComponentPageHeader
        title="Error Boundary"
        description="Catch and handle React errors gracefully with fallback UIs"
        showBackLink
      />

      <ComponentSection title="Component Demos">
        <Text as="p" styleProps={{ size: 'sm', colour: 'muted-foreground' }} className="mb-6">
          Click through each tab to explore basic error catching, custom fallback components, and
          nested boundary isolation. Use the trigger buttons to simulate errors.
        </Text>
        <DemoTabs tabs={componentTabs} />
      </ComponentSection>

      {/* Developer Instructions */}
      <DeveloperInstructions title="Error Boundary Best Practices">
        <div className="space-y-4">
          <div>
            <Text styleProps={{ weight: 'semibold', size: 'sm' }} className="mb-2">
              Placement Strategy
            </Text>
            <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
              <li>
                <strong>Root level:</strong> Catches catastrophic errors (in{' '}
                <code className="rounded bg-muted px-1">main.tsx</code>)
              </li>
              <li>
                <strong>Feature level:</strong> Isolates failures in auth, dashboard, forms
              </li>
              <li>
                <strong>Component level:</strong> For third-party or unstable components
              </li>
            </ul>
          </div>

          <div>
            <Text styleProps={{ weight: 'semibold', size: 'sm' }} className="mb-2">
              {`What Error Boundaries DON'T Catch`}
            </Text>
            <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
              <li>Event handlers (use try/catch)</li>
              <li>Async code (promises, setTimeout)</li>
              <li>Server-side rendering</li>
              <li>Errors in the error boundary itself</li>
            </ul>
          </div>

          <div>
            <Text styleProps={{ weight: 'semibold', size: 'sm' }} className="mb-2">
              Usage Examples
            </Text>
            <pre className="rounded bg-muted p-3 text-xs">
              {`// Basic usage
<ErrorBoundary>
  <MyComponent />
</ErrorBoundary>

// With custom fallback
<ErrorBoundary FallbackComponent={CustomFallback}>
  <MyComponent />
</ErrorBoundary>

// With reset keys (auto-reset on route change)
<ErrorBoundary
  resetKeys={[location.pathname]}
  onReset={() => logger.info('Error boundary reset')}
>
  <Router />
</ErrorBoundary>

// With error reporting (production only)
<ErrorBoundary onError={(error) => Sentry.captureException(error)}>
  <App />
</ErrorBoundary>`}
            </pre>
          </div>
        </div>
      </DeveloperInstructions>
    </ComponentPageWrapper>
  );
};

// ============================================================================
// Basic Demo
// ============================================================================

const BasicDemo: React.FC = () => {
  const [shouldThrow, setShouldThrow] = useState(false);
  const [resetCount, setResetCount] = useState(0);

  return (
    <div className="space-y-4">
      <Text as="p" styleProps={{ size: 'sm', colour: 'muted-foreground' }}>
        Demonstrates error catching and recovery. Click &ldquo;Trigger Error&rdquo; to throw an
        error, then use the fallback UI to reset.
      </Text>
      <ErrorBoundary
        onReset={() => {
          setShouldThrow(false);
          setResetCount((prev) => prev + 1);
        }}
      >
        {shouldThrow ? <BuggyComponent shouldThrow /> : <BuggyComponent shouldThrow={false} />}
      </ErrorBoundary>

      <div className="flex gap-2">
        <Button
          variant="destructive"
          onClick={() => {
            setShouldThrow(true);
          }}
        >
          Trigger Error
        </Button>
        {resetCount > 0 && (
          <Text styleProps={{ colour: 'muted-foreground', size: 'sm' }} className="self-center">
            Reset count: {resetCount}
          </Text>
        )}
      </div>
    </div>
  );
};

// ============================================================================
// Custom Fallback Demo
// ============================================================================

const CustomFallbackDemo: React.FC = () => {
  const [shouldThrow, setShouldThrow] = useState(false);

  return (
    <div className="space-y-4">
      <Text as="p" styleProps={{ size: 'sm', colour: 'muted-foreground' }}>
        Use the <code className="rounded bg-muted px-1">FallbackComponent</code> prop to customise
        the error UI.
      </Text>
      <ErrorBoundary
        FallbackComponent={CustomErrorFallback}
        onReset={() => {
          setShouldThrow(false);
        }}
      >
        {shouldThrow ? <BuggyComponent shouldThrow /> : <BuggyComponent shouldThrow={false} />}
      </ErrorBoundary>

      <Button
        variant="destructive"
        onClick={() => {
          setShouldThrow(true);
        }}
      >
        Trigger Error (Custom Fallback)
      </Button>
    </div>
  );
};

// ============================================================================
// Nested Boundaries Demo
// ============================================================================

const NestedBoundariesDemo: React.FC = () => {
  const [throwOuter, setThrowOuter] = useState(false);
  const [throwInner, setThrowInner] = useState(false);

  return (
    <div className="space-y-4">
      <Text as="p" styleProps={{ size: 'sm', colour: 'muted-foreground' }}>
        {`Multiple boundaries isolate errors to specific features. Inner boundary failures don't affect outer components.`}
      </Text>
      <ErrorBoundary
        onReset={() => {
          setThrowOuter(false);
        }}
      >
        <Card>
          <div className="space-y-4">
            <Text styleProps={{ weight: 'semibold' }}>Outer Boundary</Text>

            {throwOuter && <BuggyComponent shouldThrow />}

            <ErrorBoundary
              onReset={() => {
                setThrowInner(false);
              }}
            >
              <Card>
                <div className="space-y-4">
                  <Text styleProps={{ weight: 'semibold' }}>Inner Boundary</Text>

                  {throwInner ? (
                    <BuggyComponent shouldThrow />
                  ) : (
                    <Text styleProps={{ colour: 'muted-foreground', size: 'sm' }}>
                      Inner component is working
                    </Text>
                  )}
                </div>
              </Card>
            </ErrorBoundary>
          </div>
        </Card>
      </ErrorBoundary>

      <div className="flex gap-2">
        <Button
          variant="destructive"
          size="sm"
          onClick={() => {
            setThrowInner(true);
          }}
        >
          Error in Inner Boundary
        </Button>
        <Button
          variant="destructive"
          size="sm"
          onClick={() => {
            setThrowOuter(true);
          }}
        >
          Error in Outer Boundary
        </Button>
      </div>
    </div>
  );
};
