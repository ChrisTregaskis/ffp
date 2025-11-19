import { Component, type ErrorInfo, type ReactNode } from 'react';

import { createLogger } from '@web/lib/logger';

import { ErrorFallback } from './ErrorFallback';

const logger = createLogger('ErrorBoundary');

/**
 * Props for the ErrorBoundary component
 */
interface ErrorBoundaryProps {
  /** Child components to render within the error boundary */
  children: ReactNode;
  /** Optional custom fallback component to render on error */
  FallbackComponent?: React.ComponentType<{
    error: Error;
    resetErrorBoundary?: () => void;
  }>;
  /** Optional callback function called when an error is caught (production only) */
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  /** Optional callback function called when error boundary is reset */
  onReset?: () => void;
  /** Array of values that will trigger a reset when changed (e.g., location.pathname) */
  resetKeys?: unknown[];
}

/**
 * State for the ErrorBoundary component
 */
interface ErrorBoundaryState {
  /** Whether an error has been caught */
  hasError: boolean;
  /** The error that was caught, if any */
  error: Error | null;
}

/**
 * Error Boundary component for catching and handling React errors
 *
 * Wraps components to catch errors during rendering, in lifecycle methods,
 * and in constructors of the whole tree below them.
 *
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  /**
   * Update state when an error is caught
   *
   * @param error - The error that was thrown
   * @returns Updated state
   */
  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
    };
  }

  /**
   * Log error information when an error is caught
   *
   * @param error - The error that was thrown
   * @param errorInfo - Additional error information including component stack
   */
  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Always log errors to browser console
    logger.error('Error boundary caught an error', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
    });

    // Only call onError callback in production (avoid duplicate reports in development)
    // In development, React re-throws errors even after catching them
    if (import.meta.env.ENVIRONMENT !== 'DEVELOPMENT' && this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  /**
   * Check if resetKeys have changed and reset error boundary if so
   *
   * @param prevProps - Previous props
   */
  componentDidUpdate(prevProps: ErrorBoundaryProps): void {
    const { resetKeys } = this.props;

    // Only check if we're in an error state and resetKeys exist
    if (this.state.hasError && resetKeys) {
      // Check if any of the reset keys have changed
      const hasResetKeysChanged = resetKeys.some(
        (key, index) => key !== prevProps.resetKeys?.[index]
      );

      if (hasResetKeysChanged) {
        // Call onReset callback if provided
        this.props.onReset?.();

        // Reset the error boundary
        this.resetErrorBoundary();
      }
    }
  }

  /**
   * Reset the error boundary state
   *
   * Allows users to attempt to recover from the error by re-rendering
   * the component tree.
   */
  resetErrorBoundary = (): void => {
    // Call onReset callback if provided
    this.props.onReset?.();

    this.setState({
      hasError: false,
      error: null,
    });
  };

  render(): ReactNode {
    if (this.state.hasError && this.state.error) {
      const FallbackComponent = this.props.FallbackComponent ?? ErrorFallback;

      return (
        <FallbackComponent error={this.state.error} resetErrorBoundary={this.resetErrorBoundary} />
      );
    }

    return this.props.children;
  }
}
