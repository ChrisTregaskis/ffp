import { useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { type ForgotPasswordRequestData } from '@web/components/auth';
import { ForgotPasswordConfirmForm } from '@web/components/auth/ForgotPasswordConfirmForm';
import { ForgotPasswordRequestForm } from '@web/components/auth/ForgotPasswordRequestForm';
import { ForgotPasswordSuccess } from '@web/components/auth/ForgotPasswordSuccess';
import { AuthLayout } from '@web/components/layout/AuthLayout';
import { CardTransition, type CardTransitionDirection } from '@web/components/motion';
import { useCooldownTimer } from '@web/hooks/useCooldownTimer';
import { resetPassword, confirmResetPassword } from '@web/lib/auth';
import { RouteKey, routes } from '@web/pages/routes';

/**
 * Steps in the forgot password flow
 */
enum ForgotPasswordStep {
  REQUEST_CODE = 'REQUEST_CODE',
  CONFIRM_RESET = 'CONFIRM_RESET',
  SUCCESS = 'SUCCESS',
}

/** Cooldown duration for the resend code button (in seconds) */
const RESEND_COOLDOWN_SECONDS = 60;

/**
 * Maps Cognito error names to user-friendly messages.
 *
 * Security: UserNotFoundException returns a generic message to prevent
 * email enumeration attacks.
 */
const getErrorMessage = (error: unknown): string => {
  if (!(error instanceof Error)) {
    return 'An unexpected error occurred. Please try again.';
  }

  switch (error.name) {
    case 'UserNotFoundException':
    case 'InvalidParameterException':
      return 'If an account exists with this email, a verification code has been sent.';
    case 'LimitExceededException':
      return 'Too many attempts. Please try again later.';
    case 'ExpiredCodeException':
      return 'This code has expired. Please request a new one.';
    case 'CodeMismatchException':
      return 'Invalid code. Please check and try again.';
    case 'InvalidPasswordException':
      return 'Password does not meet requirements. Please check and try again.';
    default:
      return error.message || 'An unexpected error occurred. Please try again.';
  }
};

/**
 * Forgot password page component.
 *
 * Orchestrates a three-step flow for self-service password reset:
 * 1. Request — user enters email, receives verification code via Cognito
 * 2. Confirm — user enters code and sets new password
 * 3. Success — confirmation with link back to sign in
 */
export const ForgotPasswordPage: React.FC = () => {
  const navigate = useNavigate();

  const [currentStep, setCurrentStep] = useState<ForgotPasswordStep>(
    ForgotPasswordStep.REQUEST_CODE
  );
  const [direction, setDirection] = useState<CardTransitionDirection>('forward');
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { cooldown: resendCooldown, startCooldown: startCooldownTimer } =
    useCooldownTimer(RESEND_COOLDOWN_SECONDS);

  const clearError = useCallback((): void => {
    setError(null);
  }, []);

  const handleBackToLogin = useCallback((): void => {
    void navigate(routes[RouteKey.LOGIN].path);
  }, [navigate]);

  /**
   * Calls Cognito's resetPassword to send a verification code.
   * Always advances to confirm step to prevent email enumeration.
   */
  const handleRequestCode = useCallback(
    async (data: ForgotPasswordRequestData): Promise<void> => {
      try {
        setIsLoading(true);
        setError(null);
        setEmail(data.email);

        await resetPassword({ username: data.email });

        setDirection('forward');
        setCurrentStep(ForgotPasswordStep.CONFIRM_RESET);
        startCooldownTimer();
      } catch (err) {
        // For UserNotFoundException, still advance to prevent enumeration
        if (err instanceof Error && err.name === 'UserNotFoundException') {
          setDirection('forward');
          setCurrentStep(ForgotPasswordStep.CONFIRM_RESET);
          startCooldownTimer();

          return;
        }

        setError(getErrorMessage(err));
      } finally {
        setIsLoading(false);
      }
    },
    [startCooldownTimer]
  );

  const handleResendCode = useCallback(async (): Promise<void> => {
    if (resendCooldown > 0 || !email) {
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      await resetPassword({ username: email });
      startCooldownTimer();
    } catch (err) {
      if (err instanceof Error && err.name === 'UserNotFoundException') {
        startCooldownTimer();

        return;
      }

      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, [email, resendCooldown, startCooldownTimer]);

  /**
   * Submits the verification code and new password to Cognito.
   */
  const handleConfirmReset = useCallback(
    async (code: string, newPassword: string): Promise<void> => {
      try {
        setIsLoading(true);
        setError(null);

        await confirmResetPassword({
          username: email,
          confirmationCode: code,
          newPassword,
        });

        setDirection('forward');
        setCurrentStep(ForgotPasswordStep.SUCCESS);
      } catch (err) {
        setError(getErrorMessage(err));
      } finally {
        setIsLoading(false);
      }
    },
    [email]
  );

  /** Resolve the current step's transition key and content */
  const { transitionKey, content } = useMemo(() => {
    switch (currentStep) {
      case ForgotPasswordStep.REQUEST_CODE:
        return {
          transitionKey: 'request-step',
          content: (
            <ForgotPasswordRequestForm
              onSubmit={handleRequestCode}
              isLoading={isLoading}
              error={error}
              onClearError={clearError}
              onBackToLogin={handleBackToLogin}
            />
          ),
        };
      case ForgotPasswordStep.CONFIRM_RESET:
        return {
          transitionKey: 'confirm-step',
          content: (
            <ForgotPasswordConfirmForm
              onSubmit={handleConfirmReset}
              onResendCode={handleResendCode}
              isLoading={isLoading}
              error={error}
              onClearError={clearError}
              onBackToLogin={handleBackToLogin}
              resendCooldown={resendCooldown}
            />
          ),
        };
      case ForgotPasswordStep.SUCCESS:
        return {
          transitionKey: 'success-step',
          content: <ForgotPasswordSuccess onBackToLogin={handleBackToLogin} />,
        };
    }
  }, [
    currentStep,
    handleRequestCode,
    handleConfirmReset,
    handleResendCode,
    handleBackToLogin,
    clearError,
    isLoading,
    error,
    resendCooldown,
  ]);

  return (
    <AuthLayout>
      <CardTransition transitionKey={transitionKey} direction={direction}>
        {content}
      </CardTransition>
    </AuthLayout>
  );
};
